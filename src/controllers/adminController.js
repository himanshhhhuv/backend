import catchAsync from "../utils/catchAsync.js";
import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";
import bcrypt from "bcryptjs";

/**
 * Create a new user (Admin can create users with any role)
 */
export const createUser = catchAsync(async (req, res) => {
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
  } = req.body;

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

  // Parse year
  const parsedYear =
    typeof year === "string" ? parseInt(year, 10) : Number(year);
  if (isNaN(parsedYear) || parsedYear < 1 || parsedYear > 5) {
    throw new ApiError(400, "Invalid year value");
  }

  // Validate role
  const validRoles = [
    "STUDENT",
    "WARDEN",
    "ADMIN",
    "CANTEEN_MANAGER",
    "CARETAKER",
  ];
  const userRole = role || "STUDENT";
  if (!validRoles.includes(userRole)) {
    throw new ApiError(400, "Invalid role");
  }

  // Create user and profile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

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

    const userWithProfile = await tx.user.findUnique({
      where: { id: newUser.id },
      select: {
        id: true,
        email: true,
        role: true,
        roomId: true,
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

    return userWithProfile;
  });

  res.status(201).json({
    success: true,
    data: user,
  });
});

/**
 * List all users with filtering and pagination
 */
export const listUsers = catchAsync(async (req, res) => {
  const { role, page = 1, limit = 10 } = req.query;

  // Parse pagination parameters
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    throw new ApiError(400, "Invalid page number");
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new ApiError(400, "Invalid limit (must be between 1 and 100)");
  }

  const skip = (pageNum - 1) * limitNum;

  // Build where clause for filtering
  const where = {};
  if (role) {
    const validRoles = [
      "STUDENT",
      "WARDEN",
      "ADMIN",
      "CANTEEN_MANAGER",
      "CARETAKER",
    ];
    if (!validRoles.includes(role)) {
      throw new ApiError(400, "Invalid role filter");
    }
    where.role = role;
  }

  // Get users with pagination
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      select: {
        id: true,
        email: true,
        role: true,
        roomId: true,
        createdAt: true,
        profile: {
          select: {
            name: true,
            rollNo: true,
            phone: true,
            course: true,
            year: true,
          },
        },
        room: {
          select: {
            id: true,
            roomNo: true,
            floor: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  });
});

/**
 * Create a new room
 */
export const createRoom = catchAsync(async (req, res) => {
  const { roomNo, floor, capacity } = req.body;

  // Validate required fields
  if (!roomNo || floor === undefined || !capacity) {
    throw new ApiError(400, "Missing required fields: roomNo, floor, capacity");
  }

  // Parse numeric fields
  const parsedFloor = parseInt(floor, 10);
  const parsedCapacity = parseInt(capacity, 10);

  if (isNaN(parsedFloor) || parsedFloor < 0) {
    throw new ApiError(400, "Invalid floor number");
  }

  if (isNaN(parsedCapacity) || parsedCapacity < 1) {
    throw new ApiError(400, "Invalid capacity (must be at least 1)");
  }

  // Check if room number already exists
  const existingRoom = await prisma.room.findUnique({
    where: { roomNo: roomNo.toString() },
  });

  if (existingRoom) {
    throw new ApiError(400, "Room number already exists");
  }

  // Create room
  const room = await prisma.room.create({
    data: {
      roomNo: roomNo.toString(),
      floor: parsedFloor,
      capacity: parsedCapacity,
      occupied: 0,
    },
  });

  res.status(201).json({
    success: true,
    data: room,
  });
});

/**
 * Assign a student to a room
 */
export const assignRoom = catchAsync(async (req, res) => {
  const { id: roomId } = req.params;
  const { studentId } = req.body;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required");
  }

  // Check if room exists
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      students: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  // Check if room is full
  if (room.occupied >= room.capacity) {
    throw new ApiError(400, "Room is full");
  }

  // Check if student exists and is a student
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    include: {
      profile: {
        select: {
          name: true,
          rollNo: true,
        },
      },
    },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  if (student.role !== "STUDENT") {
    throw new ApiError(400, "User is not a student");
  }

  // Check if student is already assigned to a room
  if (student.roomId) {
    throw new ApiError(400, "Student is already assigned to a room");
  }

  // Assign student to room
  const [updatedStudent, updatedRoom] = await prisma.$transaction([
    prisma.user.update({
      where: { id: studentId },
      data: { roomId },
      include: {
        profile: {
          select: {
            name: true,
            rollNo: true,
          },
        },
      },
    }),
    prisma.room.update({
      where: { id: roomId },
      data: {
        occupied: {
          increment: 1,
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      room: {
        id: updatedRoom.id,
        roomNo: updatedRoom.roomNo,
        floor: updatedRoom.floor,
        capacity: updatedRoom.capacity,
        occupied: updatedRoom.occupied,
      },
      student: {
        id: updatedStudent.id,
        email: updatedStudent.email,
        name: updatedStudent.profile?.name,
        rollNo: updatedStudent.profile?.rollNo,
      },
    },
  });
});

/**
 * Delete a user
 */
export const deleteUser = catchAsync(async (req, res) => {
  const { id: userId } = req.params;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        select: {
          name: true,
          rollNo: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent deletion of the last admin
  if (user.role === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount <= 1) {
      throw new ApiError(
        400,
        "Cannot delete the last admin user. Please create another admin first."
      );
    }
  }

  // If user is assigned to a room, update room's occupied count
  if (user.roomId) {
    await prisma.$transaction([
      prisma.room.update({
        where: { id: user.roomId },
        data: {
          occupied: {
            decrement: 1,
          },
        },
      }),
      prisma.user.delete({
        where: { id: userId },
      }),
    ]);
  } else {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  res.json({
    success: true,
    message: "User deleted successfully",
    data: {
      id: userId,
      email: user.email,
      name: user.profile?.name,
      role: user.role,
    },
  });
});

/**
 * Get summary report with statistics
 */
export const getSummaryReport = catchAsync(async (req, res) => {
  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get all statistics in parallel
  const [
    totalStudents,
    totalRooms,
    occupiedRooms,
    pendingLeaves,
    pendingComplaints,
    attendanceToday,
  ] = await Promise.all([
    // Total students
    prisma.user.count({
      where: { role: "STUDENT" },
    }),
    // Total rooms
    prisma.room.count(),
    // Occupied rooms
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
    // Today's attendance
    prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        status: true,
      },
    }),
  ]);

  // Calculate attendance statistics
  const presentCount = attendanceToday.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const absentCount = attendanceToday.filter(
    (a) => a.status === "ABSENT"
  ).length;
  const totalAttendance = attendanceToday.length;
  const attendancePercentage =
    totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

  res.json({
    success: true,
    data: {
      totalStudents,
      totalRooms,
      occupiedRooms,
      availableRooms: totalRooms - occupiedRooms,
      pendingLeaves,
      pendingComplaints,
      attendanceToday: {
        present: presentCount,
        absent: absentCount,
        total: totalAttendance,
        percentage: parseFloat(attendancePercentage.toFixed(2)),
      },
    },
  });
});
