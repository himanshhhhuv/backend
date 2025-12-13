import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";
import { sendComplaintNotification } from "./telegramBotService.js";

/**
 * Create a new complaint
 * @param {string} studentId - Student ID
 * @param {Object} payload - Complaint data (title, description, image)
 * @returns {Object} Created complaint
 */
export const createComplaint = async (studentId, payload) => {
  const { title, description, image } = payload;

  // Validate required fields
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId, role: "STUDENT" },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Create complaint
  const complaint = await prisma.complaint.create({
    data: {
      studentId,
      title,
      description,
      image: image || null,
      status: "PENDING",
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              rollNo: true,
            },
          },
        },
      },
    },
  });

  return complaint;
};

/**
 * List complaints with optional filters
 * @param {Object} filter - Filter options (studentId, status)
 * @returns {Array} List of complaints
 */
export const listComplaints = async (filter = {}) => {
  const { studentId, status } = filter;

  const where = {};
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;

  const complaints = await prisma.complaint.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          email: true,
          roomId: true,
          profile: {
            select: {
              name: true,
              rollNo: true,
              phone: true,
            },
          },
          room: {
            select: {
              roomNo: true,
              floor: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc", // Most recent first
    },
  });

  return complaints;
};

/**
 * Update complaint status
 * @param {string} complaintId - Complaint ID
 * @param {string} status - New status (PENDING, IN_PROGRESS, RESOLVED)
 * @param {string} remarks - Optional remarks
 * @returns {Object} Updated complaint
 */
export const updateComplaintStatus = async (complaintId, status, remarks) => {
  // Validate status
  const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  // Check if complaint exists
  const existingComplaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!existingComplaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Update complaint
  const updateData = {
    status,
  };

  // Set resolvedAt timestamp if status is RESOLVED
  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  }

  const complaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: updateData,
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              rollNo: true,
            },
          },
        },
      },
    },
  });

  // Send Telegram notification for complaint status change
  try {
    await sendComplaintNotification(complaint.studentId, {
      title: complaint.title,
      status: complaint.status,
    });
  } catch (notifyError) {
    console.error(
      "Failed to send Telegram complaint notification:",
      notifyError
    );
    // Don't throw - notification failure shouldn't fail the status update
  }

  return complaint;
};

/**
 * Get complaint by ID
 * @param {string} complaintId - Complaint ID
 * @returns {Object} Complaint details
 */
export const getComplaintById = async (complaintId) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              rollNo: true,
              phone: true,
            },
          },
          room: {
            select: {
              roomNo: true,
              floor: true,
            },
          },
        },
      },
    },
  });

  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  return complaint;
};
