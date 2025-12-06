import { Router } from "express";
import {
  register,
  login,
  refreshToken,
  logout,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "../controllers/authController.js";
import { validate } from "../middleware/validate.js";
import { authSchemas } from "../validations/authValidation.js";

const router = Router();

// Authentication
router.post("/register", validate(authSchemas.register), register);
router.post("/login", validate(authSchemas.login), login);
router.post("/refresh-token", validate(authSchemas.refresh), refreshToken);
router.post("/logout", logout);

// Password Reset Flow
router.post(
  "/forgot-password",
  validate(authSchemas.forgotPassword),
  forgotPasswordHandler
);
router.post(
  "/reset-password",
  validate(authSchemas.resetPassword),
  resetPasswordHandler
);

export default router;
