import catchAsync from "../utils/catchAsync.js";
import { getStudentAttendance } from "../services/attendanceService.js";
import {
  getStudentTransactions,
  getStudentBalance,
  getStudentWalletSummary,
} from "../services/canteenService.js";
import { createLeaveRequest, listLeaves } from "../services/leaveService.js";
import {
  createComplaint,
  listComplaints,
} from "../services/complaintService.js";
import {
  getStudentProfile,
  updateStudentProfile,
} from "../services/profileService.js";
import { getStudentDashboardStats } from "../services/statsService.js";

export const getProfile = catchAsync(async (req, res) => {
  const profile = await getStudentProfile(req.user.userId);
  res.json({ profile });
});

export const updateProfile = catchAsync(async (req, res) => {
  const profile = await updateStudentProfile(req.user.userId, req.body);
  res.json({ message: "Profile updated successfully", profile });
});

export const getAttendance = catchAsync(async (req, res) => {
  const { date } = req.query;

  const options = {};
  if (date) {
    options.date = date;
  }

  const attendance = await getStudentAttendance(req.user.userId, options);

  res.json({
    success: true,
    data: {
      attendance,
    },
  });
});

export const getCanteenSummary = catchAsync(async (req, res) => {
  const transactions = await getStudentTransactions(req.user.userId);
  const balance = await getStudentBalance(req.user.userId);
  res.json({ balance, transactions });
});

export const listLeaveRequests = catchAsync(async (req, res) => {
  const leaves = await listLeaves(req.user.userId);
  res.json({ leaves });
});

export const createLeave = catchAsync(async (req, res) => {
  const leave = await createLeaveRequest(req.user.userId, req.body);
  res.status(201).json({ leave });
});

export const listStudentComplaints = catchAsync(async (req, res) => {
  const complaints = await listComplaints({ studentId: req.user.userId });
  res.json({ complaints });
});

export const createStudentComplaint = catchAsync(async (req, res) => {
  const complaint = await createComplaint(req.user.userId, req.body);
  res.status(201).json({ complaint });
});

export const getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.userId;

  const [stats, wallet] = await Promise.all([
    getStudentDashboardStats(userId),
    getStudentWalletSummary(userId),
  ]);

  res.json({
    success: true,
    data: {
      ...stats,
      wallet,
    },
  });
});
