import catchAsync from "../utils/catchAsync.js";
import {
  listPendingLeaves,
  updateLeaveStatus,
} from "../services/leaveService.js";
import {
  markAttendanceBulk,
  getStudentAttendance,
} from "../services/attendanceService.js";
import {
  listComplaints,
  updateComplaintStatus,
} from "../services/complaintService.js";

export const getPendingLeaves = catchAsync(async (req, res) => {
  const leaves = await listPendingLeaves();
  res.json({ leaves });
});

export const approveLeave = catchAsync(async (req, res) => {
  const leave = await updateLeaveStatus(req.params.id, "APPROVED", req.user.id);
  res.json({ leave });
});

export const rejectLeave = catchAsync(async (req, res) => {
  const leave = await updateLeaveStatus(req.params.id, "REJECTED", req.user.id);
  res.json({ leave });
});

export const markAttendance = catchAsync(async (req, res) => {
  const attendance = await markAttendanceBulk(req.body.records || []);
  res.json({ attendance });
});

export const getStudentAttendanceById = catchAsync(async (req, res) => {
  const attendance = await getStudentAttendance(req.params.studentId);
  res.json({ attendance });
});

export const listAllComplaints = catchAsync(async (req, res) => {
  const complaints = await listComplaints();
  res.json({ complaints });
});

export const updateComplaint = catchAsync(async (req, res) => {
  const complaint = await updateComplaintStatus(req.params.id, req.body.status);
  res.json({ complaint });
});
