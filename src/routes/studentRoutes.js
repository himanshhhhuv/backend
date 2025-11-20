import { Router } from 'express';
import { protect, allowRoles } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { leaveSchemas } from '../validations/leaveValidation.js';
import { complaintSchemas } from '../validations/complaintValidation.js';
import { getProfile, updateProfile, getAttendance, getCanteenSummary, listLeaveRequests, createLeave, listStudentComplaints, createStudentComplaint } from '../controllers/studentController.js';

const router = Router();

router.use(protect, allowRoles('STUDENT'));

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/attendance', getAttendance);
router.get('/canteen', getCanteenSummary);
router.get('/leaves', listLeaveRequests);
router.post('/leaves', validate(leaveSchemas.create), createLeave);
router.get('/complaints', listStudentComplaints);
router.post('/complaints', validate(complaintSchemas.create), createStudentComplaint);

export default router;

