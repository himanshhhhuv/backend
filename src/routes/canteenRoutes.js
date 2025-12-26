import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { menuSchemas, orderSchemas } from "../validations/menuValidation.js";
import * as menuController from "../controllers/menuController.js";
import * as foodOrderController from "../controllers/foodOrderController.js";
import {
  getDashboardStats as getCanteenDashboardStats,
  lookupStudent,
} from "../controllers/canteenController.js";

const router = Router();

// All routes require authentication
router.use(protect);

// ==================== PUBLIC MENU (Students & All) ====================

// Get available menu items (for students to see what's available)
router.get("/menu", menuController.getAvailable);

// ==================== STUDENT ROUTES ====================

// Get student's own food orders
router.get(
  "/orders/my",
  allowRoles("STUDENT"),
  foodOrderController.getMyOrders
);

// ==================== CANTEEN MANAGER ROUTES ====================

// Create food order (billing) - by student ID
router.post(
  "/orders",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  validate(orderSchemas.createOrder),
  foodOrderController.createOrder
);

// Create food order (quick billing) - by roll number
router.post(
  "/orders/quick",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  validate(orderSchemas.createOrderByRollNo),
  foodOrderController.createOrderQuick
);

// Quick billing endpoint (alias for /orders/quick)
router.post(
  "/billing",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  validate(orderSchemas.createOrderByRollNo),
  foodOrderController.createOrderQuick
);

// Lookup student by roll number (for POS)
router.get(
  "/lookup/:rollNo",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  lookupStudent
);

// Get all orders (for manager dashboard)
router.get(
  "/orders",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  foodOrderController.listOrders
);

// Get today's summary (dashboard - legacy)
router.get(
  "/dashboard/today",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  foodOrderController.todaySummary
);

// New: unified dashboard statistics
router.get(
  "/dashboard/stats",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  getCanteenDashboardStats
);

// Get specific order details
router.get(
  "/orders/:id",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  foodOrderController.getOrder
);

// Get specific student's orders
router.get(
  "/orders/student/:studentId",
  allowRoles("CANTEEN_MANAGER", "ADMIN"),
  foodOrderController.getStudentOrdersAdmin
);

// ==================== ADMIN ROUTES (Menu Management) ====================

// Get all menu items (including unavailable)
router.get("/menu/all", allowRoles("ADMIN"), menuController.getAll);

// Create menu item
router.post(
  "/menu",
  allowRoles("ADMIN"),
  validate(menuSchemas.createItem),
  menuController.create
);

// Bulk create menu items
router.post(
  "/menu/bulk",
  allowRoles("ADMIN"),
  validate(menuSchemas.bulkCreate),
  menuController.bulkCreate
);

// Bulk update prices
router.patch(
  "/menu/prices",
  allowRoles("ADMIN"),
  validate(menuSchemas.bulkUpdatePrices),
  menuController.updatePrices
);

// Update menu item
router.patch(
  "/menu/:id",
  allowRoles("ADMIN"),
  validate(menuSchemas.updateItem),
  menuController.update
);

// Toggle item availability
router.patch("/menu/:id/toggle", allowRoles("ADMIN"), menuController.toggle);

// Delete menu item
router.delete("/menu/:id", allowRoles("ADMIN"), menuController.remove);

// Get single menu item
router.get(
  "/menu/:id",
  allowRoles("ADMIN", "CANTEEN_MANAGER"),
  menuController.getOne
);

export default router;
