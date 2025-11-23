import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";

/**
 * Get student profile with all details
 * @param {string} userId - User ID
 * @returns {Object} - User profile data
 */
export const getStudentProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      room: {
        select: {
          id: true,
          roomNo: true,
          floor: true,
          capacity: true,
          occupied: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

/**
 * Update student profile
 * @param {string} userId - User ID
 * @param {Object} data - Profile update data
 * @returns {Object} - Updated profile
 */
export const updateStudentProfile = async (userId, data) => {
  const { name, phone, parentPhone, photo, address } = data;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.profile) {
    throw new ApiError(404, "Profile not found");
  }

  // Update profile
  const updatedProfile = await prisma.profile.update({
    where: { userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(parentPhone && { parentPhone }),
      ...(photo && { photo }),
      ...(address && { address }),
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          room: {
            select: {
              id: true,
              roomNo: true,
              floor: true,
              capacity: true,
              occupied: true,
            },
          },
        },
      },
    },
  });

  return updatedProfile;
};
