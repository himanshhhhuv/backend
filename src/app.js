import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import wardenRoutes from "./routes/wardenRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import canteenRoutes from "./routes/canteenRoutes.js";
import caretakerRoutes from "./routes/caretakerRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  transactionLimiter,
  getCorsOptions,
} from "./middleware/security.js";

const app = express();

// =========================
// SECURITY MIDDLEWARE
// =========================

// Helmet - Security headers (XSS, clickjacking, MIME sniffing protection)
app.use(helmetMiddleware);

// CORS - Configured for specific origins (not wide open)
app.use(cors(getCorsOptions()));

// General rate limiting for all API routes
app.use("/api", apiLimiter);

// =========================
// BODY PARSERS & UTILITIES
// =========================

app.use(express.json({ limit: "10kb" })); // Limit body size to prevent DoS
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// Logging (only in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// =========================
// HEALTH CHECK
// =========================

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// =========================
// API ROUTES
// =========================

// Auth routes with stricter rate limiting (prevent brute-force)
app.use("/api/auth", authLimiter, authRoutes);

// Student routes
app.use("/api/student", studentRoutes);

// Warden routes
app.use("/api/warden", wardenRoutes);

// Admin routes
app.use("/api/admin", adminRoutes);

// Canteen routes with transaction rate limiting
app.use("/api/canteen", transactionLimiter, canteenRoutes);

// Caretaker routes
app.use("/api/caretaker", caretakerRoutes);

// =========================
// ERROR HANDLING
// =========================

app.use(errorHandler);

export default app;
