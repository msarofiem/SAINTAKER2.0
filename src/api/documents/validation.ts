import { z } from 'zod';

export const documentGenerationSchema = z.object({
  leadId: z.string().uuid(),
  documentType: z.enum(['Retainer', 'HIPAA', 'Medicare', 'Rejection']),
  additionalData: z.record(z.string(), z.any()).optional(),
});

export type DocumentGenerationInput = z.infer<typeof documentGenerationSchema>;
