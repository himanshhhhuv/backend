import catchAsync from '../utils/catchAsync.js';
import { registerUser, loginUser, refreshAuthToken } from '../services/authService.js';

export const register = catchAsync(async (req, res) => {
  const payload = await registerUser(req.body);
  res.status(201).json({ message: 'User registered', data: payload });
});

export const login = catchAsync(async (req, res) => {
  const result = await loginUser(req.body);
  res.json(result);
});

export const refreshToken = catchAsync(async (req, res) => {
  const tokens = await refreshAuthToken(req.body.refreshToken);
  res.json(tokens);
});

export const logout = catchAsync(async (req, res) => {
  res.json({ message: 'Logged out' });
});

