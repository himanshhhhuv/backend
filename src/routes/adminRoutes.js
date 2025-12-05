import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { canteenSchemas } from "../validations/canteenValidation.js";
import {
  createUser,
  listUsers,
  deleteUser,
  createRoom,
  assignRoom,
  getSummaryReport,
} from "../controllers/adminController.js";
import {
  createTransaction,
  listAllTransactions,
  getStats,
  getStudentBalanceAdmin,
} from "../controllers/canteenController.js";

const router = Router();

router.use(protect, allowRoles("ADMIN"));

// User management
router.post("/users", createUser);
router.get("/users", listUsers);
router.delete("/users/:id", deleteUser);

// Room management
router.post("/rooms", createRoom);
router.patch("/rooms/:id/assign", assignRoom);

// Reports
router.get("/reports/summary", getSummaryReport);

// Canteen / Transaction management
router.post(
  "/canteen/transactions",
  validate(canteenSchemas.transaction),
  createTransaction
);
router.get("/canteen/transactions", listAllTransactions);
router.get("/canteen/stats", getStats);
router.get("/canteen/balance/:studentId", getStudentBalanceAdmin);

export default router;
