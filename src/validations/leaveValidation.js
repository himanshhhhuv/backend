import { z } from 'zod';

export const leaveSchemas = {
  create: z.object({
    body: z.object({
      fromDate: z.string(),
      toDate: z.string(),
      reason: z.string().min(5),
    }),
  }),
  updateStatus: z.object({
    body: z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED']) }),
    params: z.object({ id: z.string().cuid().or(z.string().min(1)) }),
  }),
};

