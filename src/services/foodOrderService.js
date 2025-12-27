import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";
import { getStudentBalance } from "./canteenService.js";
import {
  sendTransactionEmail,
  sendLowBalanceEmail,
  LOW_BALANCE_THRESHOLD,
} from "./notificationService.js";

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${dateStr}-${random}`;
};

/**
 * Create a food order (Canteen Manager)
 * This is the main billing function
 *
 * @param {Object} orderData - Order details
 * @param {string} orderData.studentId - Student ID
 * @param {string} orderData.mealType - BREAKFAST, LUNCH, EVENING_SNACKS, DINNER, OTHER
 * @param {Array} orderData.items - Array of { menuItemId, quantity }
 * @param {string} managerId - ID of canteen manager creating the order
 */
export const createFoodOrder = async (orderData, managerId) => {
  const { studentId, mealType, items } = orderData;

  // Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Order must contain at least one item");
  }

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: { profile: true },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.role !== "STUDENT") {
    throw new ApiError(400, "Orders can only be placed for students");
  }

  // Get menu items and calculate totals
  const menuItemIds = items.map((item) => item.menuItemId);
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: menuItemIds },
      isAvailable: true,
    },
  });

  // Check if all items are available
  if (menuItems.length !== menuItemIds.length) {
    const foundIds = menuItems.map((m) => m.id);
    const missingIds = menuItemIds.filter((id) => !foundIds.includes(id));
    throw new ApiError(
      400,
      `Some menu items are not available: ${missingIds.join(", ")}`
    );
  }

  // Calculate order items with subtotals
  const orderItems = items.map((item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    const quantity = parseInt(item.quantity, 10);

    if (isNaN(quantity) || quantity <= 0) {
      throw new ApiError(400, `Invalid quantity for item: ${menuItem.name}`);
    }

    const subtotal = menuItem.price * quantity;

    return {
      menuItemId: menuItem.id,
      itemName: menuItem.name,
      quantity,
      unitPrice: menuItem.price,
      subtotal,
    };
  });

  // Calculate total amount
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Check student balance
  const currentBalance = await getStudentBalance(studentId);

  if (currentBalance < totalAmount) {
    throw new ApiError(
      400,
      `Insufficient balance. Current: ₹${currentBalance.toFixed(
        2
      )}, Required: ₹${totalAmount.toFixed(2)}`
    );
  }

  // Create order with transaction in a database transaction
  const result = await prisma.$transaction(async (tx) => {
    // Create the debit transaction first
    const transaction = await tx.transaction.create({
      data: {
        studentId,
        amount: totalAmount,
        type: "DEBIT",
        description: `Canteen - ${mealType} (${orderItems.length} items)`,
      },
    });

    // Create the food order
    const foodOrder = await tx.foodOrder.create({
      data: {
        orderNumber: generateOrderNumber(),
        studentId,
        mealType,
        totalAmount,
        transactionId: transaction.id,
        servedById: managerId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: true,
                unit: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                rollNo: true,
              },
            },
          },
        },
        servedBy: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return { foodOrder, transaction };
  });

  // Calculate new balance
  const newBalance = currentBalance - totalAmount;

  // Generate receipt/bill details
  const receipt = {
    orderNumber: result.foodOrder.orderNumber,
    studentName: student.profile?.name || "Student",
    rollNo: student.profile?.rollNo,
    mealType,
    items: orderItems.map((item) => ({
      name: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    })),
    totalAmount,
    previousBalance: currentBalance,
    newBalance,
    date: result.foodOrder.createdAt,
  };

  // Send transaction email (non-blocking - fire and forget)
  sendTransactionEmail({
    studentEmail: student.email,
    studentName: student.profile?.name || "Student",
    transactionType: "DEBIT",
    amount: totalAmount,
    description: `Canteen ${mealType}: ${orderItems
      .map((i) => `${i.itemName} x${i.quantity}`)
      .join(", ")}`,
    balance: newBalance,
  }).catch((emailError) => {
    console.error("Failed to send transaction email:", emailError);
  });

  // Send low balance warning if needed (non-blocking - fire and forget)
  if (newBalance < LOW_BALANCE_THRESHOLD) {
    sendLowBalanceEmail({
      studentEmail: student.email,
      studentName: student.profile?.name || "Student",
      balance: newBalance,
    })
      .then(() => {
        console.log(`⚠️ Low balance alert sent to ${student.email}`);
      })
      .catch((emailError) => {
        console.error("Failed to send low balance email:", emailError);
      });
  }

  return {
    order: result.foodOrder,
    receipt,
    lowBalanceWarning: newBalance < LOW_BALANCE_THRESHOLD,
  };
};

/**
 * Get order by ID
 */
export const getOrderById = async (orderId) => {
  const order = await prisma.foodOrder.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              id: true,
              name: true,
              category: true,
              unit: true,
            },
          },
        },
      },
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              rollNo: true,
              course: true,
            },
          },
        },
      },
      transaction: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

/**
 * Get student's food orders
 */
export const getStudentOrders = async (studentId, filters = {}) => {
  const { mealType, startDate, endDate, page = 1, limit = 20 } = filters;

  const where = { studentId };

  if (mealType) {
    where.mealType = mealType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.foodOrder.findMany({
      where,
      include: {
        items: {
          select: {
            itemName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.foodOrder.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all orders (Admin/Manager)
 */
export const getAllOrders = async (filters = {}) => {
  const {
    studentId,
    mealType,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const where = {};

  if (studentId) where.studentId = studentId;
  if (mealType) where.mealType = mealType;

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.foodOrder.findMany({
      where,
      include: {
        items: {
          select: {
            itemName: true,
            quantity: true,
            unitPrice: true,
            subtotal: true,
          },
        },
        student: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                rollNo: true,
              },
            },
          },
        },
        servedBy: {
          select: {
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.foodOrder.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get today's orders summary (for dashboard)
 */
export const getTodaysSummary = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ordersCount, totalRevenue, mealTypeBreakdown, popularItems] =
    await Promise.all([
      // Total orders today
      prisma.foodOrder.count({
        where: { createdAt: { gte: today } },
      }),
      // Total revenue today
      prisma.foodOrder.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
      }),
      // Breakdown by meal type
      prisma.foodOrder.groupBy({
        by: ["mealType"],
        where: { createdAt: { gte: today } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Popular items today
      prisma.orderItem.groupBy({
        by: ["itemName"],
        where: {
          order: { createdAt: { gte: today } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

  return {
    ordersCount,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    mealTypeBreakdown: mealTypeBreakdown.map((m) => ({
      mealType: m.mealType,
      count: m._count,
      revenue: m._sum.totalAmount || 0,
    })),
    popularItems: popularItems.map((p) => ({
      name: p.itemName,
      totalQuantity: p._sum.quantity || 0,
    })),
  };
};

/**
 * Quick order by roll number (Canteen Manager convenience)
 */
export const createOrderByRollNo = async (orderData, managerId) => {
  const { rollNo, mealType, items } = orderData;

  // Find student by roll number
  const profile = await prisma.profile.findUnique({
    where: { rollNo },
    include: {
      user: {
        select: { id: true, role: true },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, `Student with roll number "${rollNo}" not found`);
  }

  if (profile.user.role !== "STUDENT") {
    throw new ApiError(400, "Orders can only be placed for students");
  }

  // Use the existing createFoodOrder with the found studentId
  return createFoodOrder(
    {
      studentId: profile.user.id,
      mealType,
      items,
    },
    managerId
  );
};
