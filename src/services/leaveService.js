export const createLeaveRequest = async (userId, payload) => {
  return { id: 'leave-id', userId, ...payload };
};

export const listLeaves = async (userId) => {
  return [{ id: 'leave-id', userId, status: 'PENDING' }];
};

export const listPendingLeaves = async () => {
  return [{ id: 'leave-id', status: 'PENDING' }];
};

export const updateLeaveStatus = async (leaveId, status, approverId) => {
  return { id: leaveId, status, approverId };
};

