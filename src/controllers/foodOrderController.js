import catchAsync from "../utils/catchAsync.js";
import {
  createFoodOrder,
  createOrderByRollNo,
  getOrderById,
  getStudentOrders,
  getAllOrders,
  getTodaysSummary,
} from "../services/foodOrderService.js";

/**
 * Create a food order by student ID (Canteen Manager)
 * Manager enters: studentId + items with quantities
 */
export const createOrder = catchAsync(async (req, res) => {
  const managerId = req.user.userId;
  const result = await createFoodOrder(req.body, managerId);

  let message = `Order ${
    result.order.orderNumber
  } created. ₹${result.order.totalAmount.toFixed(2)} deducted.`;
  if (result.lowBalanceWarning) {
    message += ` ⚠️ Student has low balance (₹${result.receipt.newBalance.toFixed(
      2
    )})`;
  }

  res.status(201).json({
    success: true,
    message,
    data: {
      order: result.order,
      receipt: result.receipt,
      lowBalanceWarning: result.lowBalanceWarning,
    },
  });
});

/**
 * Create a food order by roll number (Canteen Manager - Quick billing)
 * Manager enters: rollNo + items with quantities
 */
export const createOrderQuick = catchAsync(async (req, res) => {
  const managerId = req.user.userId;
  const result = await createOrderByRollNo(req.body, managerId);

  let message = `Order ${result.order.orderNumber} created for ${
    result.receipt.studentName
  }. ₹${result.order.totalAmount.toFixed(2)} deducted.`;
  if (result.lowBalanceWarning) {
    message += ` ⚠️ Low balance alert sent!`;
  }

  // Return order at top level for POS frontend compatibility
  res.status(201).json({
    success: true,
    message,
    order: result.order,
    receipt: result.receipt,
    lowBalanceWarning: result.lowBalanceWarning,
  });
});

/**
 * Get order by ID (Admin/Manager)
 */
export const getOrder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const order = await getOrderById(id);
  res.json({
    success: true,
    data: order,
  });
});

/**
 * Get student's own orders (Student)
 */
export const getMyOrders = catchAsync(async (req, res) => {
  const studentId = req.user.userId;
  const { mealType, startDate, endDate, page, limit } = req.query;

  const result = await getStudentOrders(studentId, {
    mealType,
    startDate,
    endDate,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get specific student's orders (Admin/Manager)
 */
export const getStudentOrdersAdmin = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const { mealType, startDate, endDate, page, limit } = req.query;

  const result = await getStudentOrders(studentId, {
    mealType,
    startDate,
    endDate,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get all orders with filters (Admin/Manager)
 */
export const listOrders = catchAsync(async (req, res) => {
  const { studentId, mealType, startDate, endDate, page, limit } = req.query;

  const result = await getAllOrders({
    studentId,
    mealType,
    startDate,
    endDate,
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
  });

  res.json({
    success: true,
    data: result,
  });
});

/**
 * Get today's canteen summary (Admin/Manager dashboard)
 */
export const todaySummary = catchAsync(async (req, res) => {
  const summary = await getTodaysSummary();
  res.json({
    success: true,
    data: summary,
  });
});
