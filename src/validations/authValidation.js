import { z } from "zod";

const credentials = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

const register = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(1),
    rollNo: z.string().min(6),
    phone: z.string().min(10),
    course: z.string().min(1),
    year: z
      .number()
      .int()
      .min(1)
      .max(5)
      .or(z.string().transform((val) => parseInt(val))),
    parentPhone: z.string().min(10).optional(),
    address: z.string().optional(),
    role: z.enum(["STUDENT"]).optional(), //WARDEN, ADMIN, CANTEEN_MANAGER
  }),
});

const refresh = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z
      .string({ error: "Email is required" })
      .email({ error: "Please provide a valid email address" }),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z
      .string({ error: "Reset token is required" })
      .min(1, { error: "Reset token is required" }),
    password: z
      .string({ error: "Password is required" })
      .min(6, { error: "Password must be at least 6 characters long" })
      .max(128, { error: "Password is too long" }),
  }),
});

const changePassword = z.object({
  body: z.object({
    currentPassword: z
      .string({ error: "Current password is required" })
      .min(6, {
        error: "Current password must be at least 6 characters long",
      })
      .max(128, { error: "Current password is too long" }),
    newPassword: z
      .string({ error: "New password is required" })
      .min(6, {
        error: "New password must be at least 6 characters long",
      })
      .max(128, { error: "New password is too long" }),
  }),
});

const resendVerification = z.object({
  body: z.object({
    email: z
      .string({ error: "Email is required" })
      .email({ error: "Please provide a valid email address" }),
  }),
});

export const authSchemas = {
  login: credentials,
  register,
  refresh,
  forgotPassword,
  resetPassword,
  resendVerification,
  changePassword,
};
