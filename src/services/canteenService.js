import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";
import {
  sendTransactionEmail,
  sendLowBalanceEmail,
  LOW_BALANCE_THRESHOLD,
} from "./notificationService.js";
import {
  sendTransactionNotification,
  sendLowBalanceNotification,
} from "./telegramBotService.js";

/**
 * Get student's balance from all transactions
 */
export const getStudentBalance = async (studentId) => {
  const transactions = await prisma.transaction.findMany({
    where: { studentId },
    select: {
      amount: true,
      type: true,
    },
  });

  // Calculate balance (CREDIT adds, DEBIT subtracts)
  const balance = transactions.reduce((acc, transaction) => {
    if (transaction.type === "CREDIT") {
      return acc + transaction.amount;
    } else if (transaction.type === "DEBIT") {
      return acc - transaction.amount;
    }
    return acc;
  }, 0);

  return balance;
};

/**
 * Get student's transaction history
 */
export const getStudentTransactions = async (studentId) => {
  const transactions = await prisma.transaction.findMany({
    where: { studentId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              phone: true,
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions;
};

/**
 * Get all transactions (Admin only)
 */
export const getAllTransactions = async (filters = {}) => {
  const { studentId, type, startDate, endDate, page = 1, limit = 20 } = filters;

  const where = {};

  if (studentId) {
    where.studentId = studentId;
  }

  if (type && (type === "CREDIT" || type === "DEBIT")) {
    where.type = type;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      where.date.lte = new Date(endDate);
    }
  }

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
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
      },
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get transaction statistics (Admin only)
 */
export const getTransactionStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalCredits,
    totalDebits,
    todayCredits,
    todayDebits,
    monthlyCredits,
    monthlyDebits,
    transactionCount,
  ] = await Promise.all([
    // All-time totals
    prisma.transaction.aggregate({
      where: { type: "CREDIT" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEBIT" },
      _sum: { amount: true },
    }),
    // Today's totals
    prisma.transaction.aggregate({
      where: { type: "CREDIT", date: { gte: today } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEBIT", date: { gte: today } },
      _sum: { amount: true },
    }),
    // This month's totals
    prisma.transaction.aggregate({
      where: { type: "CREDIT", date: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEBIT", date: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    // Total transaction count
    prisma.transaction.count(),
  ]);

  return {
    allTime: {
      totalCredits: totalCredits._sum.amount || 0,
      totalDebits: totalDebits._sum.amount || 0,
      netBalance:
        (totalCredits._sum.amount || 0) - (totalDebits._sum.amount || 0),
    },
    today: {
      credits: todayCredits._sum.amount || 0,
      debits: todayDebits._sum.amount || 0,
    },
    thisMonth: {
      credits: monthlyCredits._sum.amount || 0,
      debits: monthlyDebits._sum.amount || 0,
    },
    transactionCount,
  };
};

/**
 * Add a new transaction (Credit or Debit)
 */
export const addTransaction = async (payload) => {
  const { studentId, amount, type } = payload;

  // Validate amount
  if (!amount || amount <= 0) {
    throw new ApiError(400, "Amount must be a positive number");
  }

  // Provide default description if not provided
  const description =
    payload.description ||
    (type === "CREDIT"
      ? "Money added to account"
      : "Money deducted from account");

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      profile: true,
    },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.role !== "STUDENT") {
    throw new ApiError(400, "Transactions can only be made for students");
  }

  // Get current balance before transaction
  const currentBalance = await getStudentBalance(studentId);

  // Check for insufficient funds on DEBIT
  if (type === "DEBIT" && currentBalance < amount) {
    throw new ApiError(
      400,
      `Insufficient balance. Current balance: ₹${currentBalance.toFixed(
        2
      )}, Required: ₹${amount.toFixed(2)}`
    );
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      studentId,
      amount,
      type,
      description,
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              phone: true,
              course: true,
            },
          },
        },
      },
    },
  });

  // Calculate new balance after transaction
  const newBalance =
    type === "CREDIT" ? currentBalance + amount : currentBalance - amount;

  // Send transaction email notification
  try {
    await sendTransactionEmail({
      studentEmail: student.email,
      studentName: student.profile?.name || "Student",
      transactionType: type,
      amount: amount,
      description: description,
      balance: newBalance,
    });
  } catch (emailError) {
    // Log error but don't fail the transaction
    console.error("Failed to send transaction email:", emailError);
  }

  // Send Telegram transaction notification
  try {
    await sendTransactionNotification(studentId, transaction, newBalance);
  } catch (telegramError) {
    console.error(
      "Failed to send Telegram transaction notification:",
      telegramError
    );
  }

  // Send low balance warning if balance drops below threshold after DEBIT
  if (type === "DEBIT" && newBalance < LOW_BALANCE_THRESHOLD) {
    // Email notification
    try {
      await sendLowBalanceEmail({
        studentEmail: student.email,
        studentName: student.profile?.name || "Student",
        balance: newBalance,
      });
      console.log(
        `⚠️ Low balance alert sent to ${
          student.email
        } (Balance: ₹${newBalance.toFixed(2)})`
      );
    } catch (emailError) {
      console.error("Failed to send low balance email:", emailError);
    }

    // Telegram notification
    try {
      await sendLowBalanceNotification(studentId, newBalance);
    } catch (telegramError) {
      console.error(
        "Failed to send Telegram low balance notification:",
        telegramError
      );
    }
  }

  // Return transaction with balance info
  return {
    transaction,
    previousBalance: currentBalance,
    newBalance,
    lowBalanceWarning: type === "DEBIT" && newBalance < LOW_BALANCE_THRESHOLD,
  };
};

/**
 * Get student's wallet summary (balance + recent transactions)
 */
export const getStudentWalletSummary = async (studentId) => {
  const [balance, recentTransactions, stats] = await Promise.all([
    getStudentBalance(studentId),
    prisma.transaction.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 10,
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        date: true,
      },
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { studentId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalCredits = stats.find((s) => s.type === "CREDIT")?._sum.amount || 0;
  const totalDebits = stats.find((s) => s.type === "DEBIT")?._sum.amount || 0;
  const creditCount = stats.find((s) => s.type === "CREDIT")?._count || 0;
  const debitCount = stats.find((s) => s.type === "DEBIT")?._count || 0;

  return {
    balance,
    recentTransactions,
    stats: {
      totalCredits,
      totalDebits,
      creditCount,
      debitCount,
      totalTransactions: creditCount + debitCount,
    },
  };
};
