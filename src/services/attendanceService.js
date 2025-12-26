import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";

/**
 * Get attendance records for a specific student
 * @param {string} studentId - Student's user ID
 * @param {Object} options - Optional filters
 * @param {Date} options.date - Optional date to filter by (YYYY-MM-DD string or Date object)
 * @returns {Array} - Array of attendance records sorted by date (newest first)
 */
export const getStudentAttendance = async (studentId, options = {}) => {
  if (!studentId) {
    throw new ApiError(400, "Student ID is required");
  }

  const where = {
    studentId,
  };

  // Add date filter if provided
  if (options.date) {
    const targetDate = new Date(options.date);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    where.date = {
      gte: targetDate,
      lt: nextDay,
    };
  }

  const attendance = await prisma.attendance.findMany({
    where,
    orderBy: {
      date: "desc",
    },
    select: {
      id: true,
      date: true,
      status: true,
      inTime: true,
      outTime: true,
      studentId: true,
    },
  });

  return attendance;
};

/**
 * Mark attendance for multiple students in bulk
 * @param {Array} records - Array of attendance records
 * @param {string} records[].studentId - Student ID
 * @param {Date} records[].date - Attendance date
 * @param {string} records[].status - Attendance status (PRESENT, ABSENT, LATE)
 * @param {Date} [records[].inTime] - Optional check-in time
 * @param {Date} [records[].outTime] - Optional check-out time
 * @returns {Array} - Created attendance records
 */
export const markAttendanceBulk = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    throw new ApiError(400, "Records array is required and must not be empty");
  }

  // Validate all records
  const validStatuses = ["PRESENT", "ABSENT", "LATE"];

  for (const record of records) {
    if (!record.studentId) {
      throw new ApiError(400, "Each record must have a studentId");
    }
    if (!record.date) {
      throw new ApiError(400, "Each record must have a date");
    }
    if (record.status && !validStatuses.includes(record.status)) {
      throw new ApiError(
        400,
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      );
    }

    // Verify student exists
    const studentExists = await prisma.user.findUnique({
      where: { id: record.studentId },
    });

    if (!studentExists) {
      throw new ApiError(404, `Student with ID ${record.studentId} not found`);
    }
  }

  // Create attendance records using createMany or individual creates
  // Check if records already exist for the given date and student
  const createdRecords = [];

  for (const record of records) {
    const { studentId, date, status = "PRESENT", inTime, outTime } = record;

    // Parse date to ensure it's at start of day for consistency
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this student on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing record
      attendanceRecord = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          inTime: inTime ? new Date(inTime) : undefined,
          outTime: outTime ? new Date(outTime) : undefined,
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
    } else {
      // Create new record
      attendanceRecord = await prisma.attendance.create({
        data: {
          studentId,
          date: attendanceDate,
          status,
          inTime: inTime ? new Date(inTime) : null,
          outTime: outTime ? new Date(outTime) : null,
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
    }

    createdRecords.push(attendanceRecord);
  }

  return createdRecords;
};

/**
 * Get all students with their attendance status for a specific date
 * @param {Date} date - Date to check attendance for (defaults to today)
 * @returns {Array} - Array of students with their attendance status
 */
export const getStudentsWithAttendance = async (date = null) => {
  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Get all students
  const students = await prisma.user.findMany({
    where: {
      role: "STUDENT",
    },
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          name: true,
          rollNo: true,
          course: true,
          year: true,
        },
      },
      room: {
        select: {
          roomNo: true,
          floor: true,
        },
      },
    },
    orderBy: {
      profile: {
        rollNo: "asc",
      },
    },
  });

  // Get today's attendance for all students
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      date: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    select: {
      id: true,
      studentId: true,
      status: true,
      inTime: true,
      outTime: true,
    },
  });

  // Create a map of studentId -> attendance
  const attendanceMap = new Map();
  attendanceRecords.forEach((record) => {
    attendanceMap.set(record.studentId, record);
  });

  // Combine students with their attendance status
  const studentsWithAttendance = students.map((student) => {
    const attendance = attendanceMap.get(student.id);
    return {
      ...student,
      attendance: attendance
        ? {
            id: attendance.id,
            status: attendance.status,
            inTime: attendance.inTime,
            outTime: attendance.outTime,
          }
        : null,
    };
  });

  return studentsWithAttendance;
};
