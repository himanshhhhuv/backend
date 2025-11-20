import catchAsync from '../utils/catchAsync.js';

export const createUser = catchAsync(async (req, res) => {
  res.status(201).json({ message: 'Create user placeholder', data: req.body });
});

export const listUsers = catchAsync(async (req, res) => {
  res.json({ message: 'List users placeholder' });
});

export const createRoom = catchAsync(async (req, res) => {
  res.status(201).json({ message: 'Create room placeholder', data: req.body });
});

export const assignRoom = catchAsync(async (req, res) => {
  res.json({ message: 'Assign room placeholder', roomId: req.params.id, data: req.body });
});

export const getSummaryReport = catchAsync(async (req, res) => {
  res.json({ message: 'Summary report placeholder' });
});

