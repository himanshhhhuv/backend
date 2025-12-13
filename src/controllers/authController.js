import catchAsync from "../utils/catchAsync.js";
import {
  registerUser,
  loginUser,
  refreshAuthToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail,
} from "../services/authService.js";

export const register = catchAsync(async (req, res) => {
  const payload = await registerUser(req.body);
  res.status(201).json({ message: "User registered", data: payload });
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
  res.json({ message: "Logged out" });
});

/**
 * Forgot Password - Request password reset email
 */
export const forgotPasswordHandler = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await forgotPassword(email);
  res.json({ success: true, ...result });
});

/**
 * Reset Password - Set new password using reset token
 */
export const resetPasswordHandler = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  const result = await resetPassword(token, password);
  res.json({ success: true, ...result });
});

/**
 * Verify Email - Verify user's email using verification token
 */
export const verifyEmailHandler = catchAsync(async (req, res) => {
  const { token } = req.query;
  const result = await verifyEmail(token);
  res.json({ success: true, ...result });
});

/**
 * Resend Verification Email - Send a new verification email
 */
export const resendVerificationHandler = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await resendVerificationEmail(email);
  res.json({ success: true, ...result });
});
