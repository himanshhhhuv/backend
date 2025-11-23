import prisma from "../prisma/client.js";
import ApiError from "../utils/ApiError.js";

export const getStudentTransactions = async (studentId) => {
  const transactions = await prisma.transaction.findMany({
    where: {
      studentId,
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              phone: true,
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  return transactions;
};

export const addTransaction = async (payload) => {
  const { studentId, amount, type, description } = payload;

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      studentId,
      amount,
      type,
      description,
    },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              id: true,
              name: true,
              rollNo: true,
              phone: true,
              course: true,
            },
          },
        },
      },
    },
  });

  return transaction;
};

export const getStudentBalance = async (studentId) => {
  // Get all transactions for the student
  const transactions = await prisma.transaction.findMany({
    where: {
      studentId,
    },
    select: {
      amount: true,
      type: true,
    },
  });

  // Calculate balance (CREDIT adds, DEBIT subtracts)
  const balance = transactions.reduce((acc, transaction) => {
    if (transaction.type === "CREDIT") {
      return acc + transaction.amount;
    } else if (transaction.type === "DEBIT") {
      return acc - transaction.amount;
    }
    return acc;
  }, 0);

  return balance;
};
