import { z } from 'zod';

export const canteenSchemas = {
  transaction: z.object({
    body: z.object({
      studentId: z.string().min(1),
      amount: z.number().positive(),
      type: z.enum(['CREDIT', 'DEBIT']),
      description: z.string().optional(),
    }),
  }),
};

