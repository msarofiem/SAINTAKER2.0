import { z } from 'zod';

export const lienCreationSchema = z.object({
  lienType: z.enum(['Medicare', 'Medicaid', 'Private']),
  lienHolder: z.string(),
  amount: z.number().optional(),
  status: z.enum(['pending', 'received', 'negotiated', 'paid']),
  notes: z.string().optional()
});

export const lienUpdateSchema = z.object({
  lienType: z.enum(['Medicare', 'Medicaid', 'Private']).optional(),
  lienHolder: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(['pending', 'received', 'negotiated', 'paid']).optional(),
  notes: z.string().optional()
});

export type LienCreationInput = z.infer<typeof lienCreationSchema>;
export type LienUpdateInput = z.infer<typeof lienUpdateSchema>;
