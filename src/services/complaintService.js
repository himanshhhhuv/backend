export const createComplaint = async (studentId, payload) => {
  return { id: 'complaint-id', studentId, ...payload, status: 'PENDING' };
};

export const listComplaints = async (filter = {}) => {
  return [{ id: 'complaint-id', status: 'PENDING', ...filter }];
};

export const updateComplaintStatus = async (complaintId, status) => {
  return { id: complaintId, status };
};

