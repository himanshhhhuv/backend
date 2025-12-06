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
    rollNo: z.string().min(1),
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
    role: z.enum(["STUDENT", "WARDEN", "ADMIN", "CANTEEN_MANAGER"]).optional(),
  }),
});

const refresh = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

export const authSchemas = {
  login: credentials,
  register,
  refresh,
};
