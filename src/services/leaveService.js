import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";

export const createLeaveRequest = async (userId, payload) => {
  const { fromDate, toDate, reason } = payload;

  const leave = await prisma.leave.create({
    data: {
      studentId: userId,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      status: "PENDING",
    },
    include: {
      student: {
        include: {
          profile: true,
        },
      },
    },
  });

  return leave;
};

export const listLeaves = async (userId) => {
  const leaves = await prisma.leave.findMany({
    where: {
      studentId: userId,
    },
    include: {
      student: {
        include: {
          profile: {
            select:{
              id:true,
              name:true,
              rollNo:true,
              phone:true,
                 
              course:true,
            },
          },
          password:false,
        },
      },
      approvedBy: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return leaves;
};

export const listPendingLeaves = async () => {
  const leaves = await prisma.leave.findMany({
    where: {
      status: "PENDING",
    },
    include: {
      student: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return leaves;
};

export const updateLeaveStatus = async (leaveId, status, approverId) => {
  // Check if leave exists
  const existingLeave = await prisma.leave.findUnique({
    where: { id: leaveId },
  });

  if (!existingLeave) {
    throw new ApiError(404, "Leave request not found");
  }

  // Update the leave status
  const leave = await prisma.leave.update({
    where: { id: leaveId },
    data: {
      status,
      approvedById: approverId,
    },
    include: {
      student: {
        include: {
          profile: true,
        },
      },
      approvedBy: {
        include: {
          profile: true,
        },
      },
    },
  });

  return leave;
};
