import prisma from "../prisma/client.js";

/**
 * Helper to get start/end of today
 */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

/**
 * ==================== ADMIN DASHBOARD ====================
 * Combines hostel + leave/complaint + attendance + canteen stats
 */
export const getAdminDashboardStats = async () => {
  const { start, end } = getTodayRange();

  const [
    totalStudents,
    totalRooms,
    occupiedRooms,
    pendingLeaves,
    pendingComplaints,
    attendanceToday,
    leaveStatusGroups,
    complaintStatusGroups,
    todaysOrdersCount,
    todaysRevenueAgg,
    mealTypeBreakdown,
  ] = await Promise.all([
    // Total students
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    // Total rooms
    prisma.room.count(),
    // Occupied rooms (at least one student assigned)
    prisma.room.count({
      where: {
        occupied: {
          gt: 0,
        },
      },
    }),
    // Pending leaves
    prisma.leave.count({
      where: { status: "PENDING" },
    }),
    // Pending complaints
    prisma.complaint.count({
      where: { status: "PENDING" },
    }),
    // Today's attendance records
    prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        status: true,
      },
    }),
    // Leaves grouped by status
    prisma.leave.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Complaints grouped by status
    prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    }),
    // Today's food orders count
    prisma.foodOrder.count({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
    }),
    // Today's revenue
    prisma.foodOrder.aggregate({
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _sum: { totalAmount: true },
    }),
    // Meal-type breakdown for today
    prisma.foodOrder.groupBy({
      by: ["mealType"],
      where: {
        createdAt: {
          gte: start,
          lt: end,
        },
      },
      _count: true,
      _sum: { totalAmount: true },
    }),
  ]);

  const presentCount = attendanceToday.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentCount = attendanceToday.filter(
    (a) => a.status === "ABSENT"
  ).length;
  const totalAttendance = attendanceToday.length;
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  const leavesByStatus = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  leaveStatusGroups.forEach((g) => {
    leavesByStatus[g.status] = g._count || 0;
  });

  const complaintsByStatus = {
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };
  complaintStatusGroups.forEach((g) => {
    complaintsByStatus[g.status] = g._count || 0;
  });

  const todayRevenue = todaysRevenueAgg._sum.totalAmount || 0;

  return {
    cards: {
      totalStudents,
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      pendingLeaves,
      pendingComplaints,
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      todaysOrders: todaysOrdersCount,
      todaysRevenue: todayRevenue,
    },
    attendanceToday: {
      present: presentCount,
      absent: absentCount,
      total: totalAttendance,
      percentage: parseFloat(attendancePercentage.toFixed(2)),
    },
    leavesByStatus,
    complaintsByStatus,
    canteenToday: {
      ordersCount: todaysOrdersCount,
      totalRevenue: todayRevenue,
      mealTypeBreakdown: mealTypeBreakdown.map((m) => ({
        mealType: m.mealType,
        count: m._count,
        revenue: m._sum.totalAmount || 0,
      })),
    },
  };
};

/**
 * ==================== WARDEN DASHBOARD ====================
 */
export const getWardenDashboardStats = async () => {
  const { start, end } = getTodayRange();

  const [
    totalStudents,
    pendingLeaves,
    leaveStatusGroups,
    complaintStatusGroups,
    attendanceToday,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.leave.count({ where: { status: "PENDING" } }),
    prisma.leave.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.attendance.findMany({
      where: {
        date: {
          gte: start,
          lt: end,
        },
      },
      select: { status: true },
    }),
  ]);

  const presentCount = attendanceToday.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentCount = attendanceToday.filter(
    (a) => a.status === "ABSENT"
  ).length;
  const totalAttendance = attendanceToday.length;
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  const leavesByStatus = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  leaveStatusGroups.forEach((g) => {
    leavesByStatus[g.status] = g._count || 0;
  });

  const complaintsByStatus = {
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };
  complaintStatusGroups.forEach((g) => {
    complaintsByStatus[g.status] = g._count || 0;
  });

  return {
    cards: {
      totalStudents,
      pendingLeaves,
      openComplaints:
        complaintsByStatus.PENDING + complaintsByStatus.IN_PROGRESS,
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    },
    leavesByStatus,
    complaintsByStatus,
    attendanceToday: {
      present: presentCount,
      absent: absentCount,
      total: totalAttendance,
      percentage: parseFloat(attendancePercentage.toFixed(2)),
    },
  };
};

/**
 * ==================== STUDENT DASHBOARD ====================
 * Stats are scoped to the logged-in student
 */
export const getStudentDashboardStats = async (studentId) => {
  if (!studentId) {
    throw new Error("studentId is required");
  }

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [attendance, leaves, complaints] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        studentId,
        date: {
          gte: monthStart,
        },
      },
      select: { status: true },
    }),
    prisma.leave.findMany({
      where: { studentId },
      select: {
        id: true,
        fromDate: true,
        toDate: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.complaint.findMany({
      where: { studentId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const presentCount = attendance.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentCount = attendance.filter((a) => a.status === "ABSENT").length;
  const totalAttendance = attendance.length;
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  const leavesByStatus = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  };
  leaves.forEach((leave) => {
    leavesByStatus[leave.status] = (leavesByStatus[leave.status] || 0) + 1;
  });

  const complaintsByStatus = {
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };
  complaints.forEach((c) => {
    complaintsByStatus[c.status] = (complaintsByStatus[c.status] || 0) + 1;
  });

  const pendingLeaves = leavesByStatus.PENDING || 0;
  const openComplaints =
    (complaintsByStatus.PENDING || 0) + (complaintsByStatus.IN_PROGRESS || 0);

  return {
    attendance: {
      present: presentCount,
      absent: absentCount,
      total: totalAttendance,
      percentage: parseFloat(attendancePercentage.toFixed(2)),
    },
    leaves: {
      summary: leavesByStatus,
      recent: leaves,
      pendingCount: pendingLeaves,
    },
    complaints: {
      summary: complaintsByStatus,
      recent: complaints,
      openCount: openComplaints,
    },
  };
};

/**
 * ==================== CANTEEN MANAGER DASHBOARD ====================
 */
export const getCanteenDashboardStats = async () => {
  const { start } = getTodayRange();

  const [ordersCount, revenueAgg, mealTypeBreakdown, availableItems] =
    await Promise.all([
      prisma.foodOrder.count({
        where: {
          createdAt: {
            gte: start,
          },
        },
      }),
      prisma.foodOrder.aggregate({
        where: {
          createdAt: {
            gte: start,
          },
        },
        _sum: { totalAmount: true },
      }),
      prisma.foodOrder.groupBy({
        by: ["mealType"],
        where: {
          createdAt: {
            gte: start,
          },
        },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.menuItem.count({
        where: { isAvailable: true },
      }),
    ]);

  const totalRevenue = revenueAgg._sum.totalAmount || 0;

  return {
    cards: {
      todaysOrders: ordersCount,
      todaysRevenue: totalRevenue,
      availableMenuItems: availableItems,
    },
    mealTypeBreakdown: mealTypeBreakdown.map((m) => ({
      mealType: m.mealType,
      count: m._count,
      revenue: m._sum.totalAmount || 0,
    })),
  };
};

/**
 * ==================== CARETAKER DASHBOARD ====================
 */
export const getCaretakerDashboardStats = async () => {
  const { start } = getTodayRange();

  const [statusGroups, resolvedTodayCount] = await Promise.all([
    prisma.complaint.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.complaint.count({
      where: {
        status: "RESOLVED",
        resolvedAt: {
          gte: start,
        },
      },
    }),
  ]);

  const complaintsByStatus = {
    PENDING: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
  };
  statusGroups.forEach((g) => {
    complaintsByStatus[g.status] = g._count || 0;
  });

  return {
    complaintsByStatus,
    cards: {
      pendingComplaints: complaintsByStatus.PENDING,
      inProgressComplaints: complaintsByStatus.IN_PROGRESS,
      resolvedToday: resolvedTodayCount,
    },
  };
};
