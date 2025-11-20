import catchAsync from '../utils/catchAsync.js';
import { getStudentTransactions, getStudentBalance, addTransaction } from '../services/canteenService.js';

export const getCanteenInfo = catchAsync(async (req, res) => {
  const balance = await getStudentBalance(req.user.id);
  const transactions = await getStudentTransactions(req.user.id);
  res.json({ balance, transactions });
});

export const createTransaction = catchAsync(async (req, res) => {
  const transaction = await addTransaction(req.body);
  res.status(201).json({ transaction });
});

