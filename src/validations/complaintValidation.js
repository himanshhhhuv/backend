import { z } from 'zod';

export const complaintSchemas = {
  create: z.object({
    body: z.object({
      title: z.string().min(3),
      description: z.string().min(10),
      image: z.string().url().optional(),
    }),
  }),
  updateStatus: z.object({
    body: z.object({ status: z.enum(['PENDING', 'IN_PROGRESS', 'RESOLVED']) }),
    params: z.object({ id: z.string().min(1) }),
  }),
};

