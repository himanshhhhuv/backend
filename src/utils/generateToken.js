import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const signAccessToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    ...options,
  });

export const signRefreshToken = (payload, options = {}) =>
  jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    ...options,
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.accessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);

/**
 * Generate a password reset token
 * Uses JWT with a short expiry (15 minutes)
 * @param {string} userId - User ID to embed in token
 * @returns {string} - Reset token
 */
export const signPasswordResetToken = (userId) => {
  // Use a separate secret for reset tokens (derived from access secret + salt)
  const resetSecret = env.jwt.accessSecret + "_RESET";
  return jwt.sign({ userId, purpose: "password_reset" }, resetSecret, {
    expiresIn: "15m",
  });
};

/**
 * Verify a password reset token
 * @param {string} token - Reset token to verify
 * @returns {Object} - Decoded payload with userId
 */
export const verifyPasswordResetToken = (token) => {
  const resetSecret = env.jwt.accessSecret + "_RESET";
  const decoded = jwt.verify(token, resetSecret);

  // Extra safety: ensure token was generated for password reset
  if (decoded.purpose !== "password_reset") {
    throw new Error("Invalid token purpose");
  }

  return decoded;
};

/**
 * Generate a random secure token (alternative to JWT for reset)
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string} - Hex-encoded random token
 */
export const generateSecureToken = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString("hex");
};

