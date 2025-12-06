import bcrypt from "bcryptjs";
import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "../utils/generateToken.js";
import { sendPasswordResetEmail } from "./notificationService.js";

/**
 * Register a new user with profile
 * @param {Object} data - Registration data
 * @returns {Object} - User data with tokens
 */
export const registerUser = async (data) => {
  const {
    email,
    password,
    name,
    rollNo,
    phone,
    course,
    year,
    parentPhone,
    address,
    role,
  } = data;

  // Validate required fields
  if (!email || !password || !name || !rollNo || !phone || !course || !year) {
    throw new ApiError(400, "Missing required fields");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(400, "Email already registered");
  }

  // Check if roll number already exists
  const existingRollNo = await prisma.profile.findUnique({
    where: { rollNo },
  });

  if (existingRollNo) {
    throw new ApiError(400, "Roll number already registered");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Parse year - handle both string and number
  const parsedYear =
    typeof year === "string" ? parseInt(year, 10) : Number(year);
  if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 5) {
    throw new ApiError(400, "Invalid year value");
  }

  // Create user and profile in a transaction
  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role || "STUDENT", // Use provided role or default to STUDENT
        },
      });

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          name,
          rollNo,
          phone,
          course,
          year: parsedYear,
          parentPhone: parentPhone || null,
          address: address || null,
        },
      });

      // Fetch user with profile
      const userWithProfile = await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              phone: true,
              parentPhone: true,
              photo: true,
              course: true,
              year: true,
              address: true,
            },
          },
        },
      });

      if (!userWithProfile) {
        throw new ApiError(500, "Failed to retrieve created user");
      }

      return userWithProfile;
    });
  } catch (error) {
    // Log the error for debugging
    console.error("Registration transaction error:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      throw new ApiError(
        400,
        "Duplicate entry: email or roll number already exists"
      );
    }

    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle other errors
    throw new ApiError(500, `Registration failed: ${error.message}`);
  }

  // Verify user was created
  if (!user) {
    throw new ApiError(500, "User creation failed");
  }

  // Generate tokens
  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return {
    user,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Login user with email and password
 * @param {Object} credentials - Login credentials
 * @returns {Object} - User data with tokens
 */
export const loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find user with profile
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
          rollNo: true,
          phone: true,
          parentPhone: true,
          photo: true,
          course: true,
          year: true,
          address: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.password) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  // Generate tokens
  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);

  return {
    user: userWithoutPassword,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} token - Refresh token
 * @returns {Object} - New tokens
 */
export const refreshAuthToken = async (token) => {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Generate new tokens
    const tokenPayload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
};

/**
 * Request password reset - sends email with reset link
 * @param {string} email - User's email address
 * @returns {Object} - Success message (always returns success to prevent email enumeration)
 */
export const forgotPassword = async (email) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      profile: {
        select: { name: true },
      },
    },
  });

  // Always return success to prevent email enumeration attacks
  // But only send email if user exists
  if (user) {
    // Generate reset token
    const resetToken = signPasswordResetToken(user.id);

    // Build reset URL (frontend should handle this route)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send password reset email
    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.profile?.name || "User",
        resetUrl,
        expiresIn: "15 minutes",
      });
      console.log(`📧 Password reset email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      // Don't throw - we don't want to reveal if email exists
    }
  } else {
    console.log(`⚠️ Password reset requested for non-existent email: ${email}`);
  }

  // Always return success message
  return {
    message:
      "If an account with that email exists, a password reset link has been sent.",
  };
};

/**
 * Reset password using reset token
 * @param {string} token - Password reset token
 * @param {string} newPassword - New password to set
 * @returns {Object} - Success message
 */
export const resetPassword = async (token, newPassword) => {
  // Verify reset token
  let decoded;
  try {
    decoded = verifyPasswordResetToken(token);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(
        400,
        "Password reset link has expired. Please request a new one."
      );
    }
    throw new ApiError(400, "Invalid password reset link");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Validate password strength
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  console.log(`✅ Password reset successful for user: ${user.email}`);

  return {
    message:
      "Password has been reset successfully. You can now login with your new password.",
  };
};
