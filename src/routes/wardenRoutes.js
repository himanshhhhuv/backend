import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { leaveSchemas } from "../validations/leaveValidation.js";
import { complaintSchemas } from "../validations/complaintValidation.js";
import {
  getPendingLeaves,
  approveLeave,
  rejectLeave,
  markAttendance,
  getStudentAttendanceById,
  listAllComplaints,
  updateComplaint,
} from "../controllers/wardenController.js";

const router = Router();

router.use(protect, allowRoles("WARDEN", "ADMIN"));

router.get("/leaves/pending", getPendingLeaves);
router.patch(
  "/leaves/:id/approve",
  validate(leaveSchemas.updateStatus),
  approveLeave
);
router.patch(
  "/leaves/:id/reject",
  validate(leaveSchemas.updateStatus),
  rejectLeave
);
router.post("/attendance/mark", markAttendance);
router.get("/attendance/:studentId", getStudentAttendanceById);
router.get("/complaints", listAllComplaints);
router.patch(
  "/complaints/:id",
  validate(complaintSchemas.updateStatus),
  updateComplaint
);

export default router;
