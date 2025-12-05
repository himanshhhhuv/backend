import catchAsync from "../utils/catchAsync.js";
import {
  getStudentTransactions,
  getStudentBalance,
  addTransaction,
  getAllTransactions,
  getTransactionStats,
  getStudentWalletSummary,
} from "../services/canteenService.js";

/**
 * Get student's canteen info (balance + transactions)
 * For: Students
 */
export const getCanteenInfo = catchAsync(async (req, res) => {
  const balance = await getStudentBalance(req.user.userId);
  const transactions = await getStudentTransactions(req.user.userId);
  res.json({
    success: true,
    data: { balance, transactions },
  });
});

/**
 * Get student's wallet summary (balance + stats + recent transactions)
 * For: Students
 */
export const getWalletSummary = catchAsync(async (req, res) => {
  const wallet = await getStudentWalletSummary(req.user.userId);
  res.json({
    success: true,
    data: wallet,
  });
});

/**
 * Create a new transaction (Credit/Debit)
 * For: Admin
 */
export const createTransaction = catchAsync(async (req, res) => {
  const result = await addTransaction(req.body);

  let message =
    result.transaction.type === "CREDIT"
      ? `₹${result.transaction.amount} credited successfully`
      : `₹${result.transaction.amount} debited successfully`;

  // Add low balance warning to message
  if (result.lowBalanceWarning) {
    message += ` ⚠️ Low balance alert sent (Balance: ₹${result.newBalance.toFixed(2)})`;
  }

  res.status(201).json({
    success: true,
    message,
    data: {
      transaction: result.transaction,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      lowBalanceWarning: result.lowBalanceWarning || false,
    },
  });
});

/**
 * Get all transactions with filters (Admin only)
 * Query params: studentId, type, startDate, endDate, page, limit
 */
export const listAllTransactions = catchAsync(async (req, res) => {
  const { studentId, type, startDate, endDate, page, limit } = req.query;

  const result = await getAllTransactions({
    studentId,
    type,
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
 * Get transaction statistics (Admin only)
 */
export const getStats = catchAsync(async (req, res) => {
  const stats = await getTransactionStats();
  res.json({
    success: true,
    data: stats,
  });
});

/**
 * Get a specific student's balance (Admin)
 */
export const getStudentBalanceAdmin = catchAsync(async (req, res) => {
  const { studentId } = req.params;
  const balance = await getStudentBalance(studentId);
  const transactions = await getStudentTransactions(studentId);

  res.json({
    success: true,
    data: {
      studentId,
      balance,
      transactionCount: transactions.length,
    },
  });
});
