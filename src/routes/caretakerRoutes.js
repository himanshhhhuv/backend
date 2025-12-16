import { Router } from "express";
import { protect, allowRoles } from "../middleware/auth.js";
import { listAllComplaints } from "../controllers/wardenController.js";

const router = Router();

// Caretaker can only view complaints (read-only access)
router.use(protect, allowRoles("CARETAKER"));

// View all complaints
router.get("/complaints", listAllComplaints);

export default router;
