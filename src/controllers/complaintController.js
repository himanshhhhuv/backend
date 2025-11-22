import catchAsync from "../utils/catchAsync.js";
import {
  createComplaint,
  listComplaints,
  updateComplaintStatus,
} from "../services/complaintService.js";

export const createComplaintEntry = catchAsync(async (req, res) => {
  const complaint = await createComplaint(req.user.userId, req.body);
  res.status(201).json({ complaint });
});

export const getComplaints = catchAsync(async (req, res) => {
  const complaints = await listComplaints(req.query);
  res.json({ complaints });
});

export const changeComplaintStatus = catchAsync(async (req, res) => {
  const { status, remarks } = req.body;
  const complaint = await updateComplaintStatus(req.params.id, status, remarks);
  res.json({ complaint });
});
