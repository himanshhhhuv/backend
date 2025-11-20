import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { authSchemas } from "../validations/authValidation.js";

const router = Router();

router.post("/register", validate(authSchemas.register), register);
router.post("/login", validate(authSchemas.login), login);
router.post("/refresh-token", validate(authSchemas.refresh), refreshToken);
router.post("/logout", logout);

export default router;
