import catchAsync from '../utils/catchAsync.js';
import { createLeaveRequest, listLeaves, listPendingLeaves, updateLeaveStatus } from '../services/leaveService.js';

export const createLeave = catchAsync(async (req, res) => {
  const leave = await createLeaveRequest(req.user.id, req.body);
  res.status(201).json({ leave });
});

export const getLeaves = catchAsync(async (req, res) => {
  const leaves = await listLeaves(req.user.id);
  res.json({ leaves });
});

export const getPendingLeaves = catchAsync(async (req, res) => {
  const leaves = await listPendingLeaves();
  res.json({ leaves });
});

export const changeLeaveStatus = catchAsync(async (req, res) => {
  const leave = await updateLeaveStatus(req.params.id, req.body.status, req.user.id);
  res.json({ leave });
});

