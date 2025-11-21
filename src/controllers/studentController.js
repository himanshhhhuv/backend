import catchAsync from "../utils/catchAsync.js";
import { getStudentAttendance } from "../services/attendanceService.js";
import {
  getStudentTransactions,
  getStudentBalance,
} from "../services/canteenService.js";
import { createLeaveRequest, listLeaves } from "../services/leaveService.js";
import {
  createComplaint,
  listComplaints,
} from "../services/complaintService.js";

export const getProfile = catchAsync(async (req, res) => {
  res.json({ message: "Student profile placeholder", user: req.user });
});

export const updateProfile = catchAsync(async (req, res) => {
  res.json({ message: "Update profile placeholder", data: req.body });
});

export const getAttendance = catchAsync(async (req, res) => {
  const attendance = await getStudentAttendance(req.user.userId);
  res.json({ attendance });
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
