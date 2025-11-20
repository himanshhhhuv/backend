export const getStudentTransactions = async (studentId) => {
  return [{ id: 'txn-id', studentId, type: 'CREDIT', amount: 100 }];
};

export const addTransaction = async (payload) => {
  return { id: 'txn-id', ...payload };
};

export const getStudentBalance = async (studentId) => {
  return { studentId, balance: 0 };
};

