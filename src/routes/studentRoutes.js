import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { leaveSchemas } from "../validations/leaveValidation.js";
import { complaintSchemas } from "../validations/complaintValidation.js";
import {
  getProfile,
  updateProfile,
  getAttendance,
  getCanteenSummary,
  listLeaveRequests,
  createLeave,
  listStudentComplaints,
  createStudentComplaint,
  getDashboardStats,
} from "../controllers/studentController.js";
import { getWalletSummary } from "../controllers/canteenController.js";

const router = Router();

router.use(protect, allowRoles("STUDENT"));

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Profile
router.get("/me", getProfile);
router.put("/me", updateProfile);

// Attendance
router.get("/attendance", getAttendance);

// Canteen / Wallet
router.get("/canteen", getCanteenSummary);
router.get("/wallet", getWalletSummary);

// Leaves
router.get("/leaves", listLeaveRequests);
router.post("/leaves", validate(leaveSchemas.create), createLeave);

// Complaints
router.get("/complaints", listStudentComplaints);
router.post(
  "/complaints",
  validate(complaintSchemas.create),
  createStudentComplaint
);

export default router;
