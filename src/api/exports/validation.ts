import { z } from 'zod';

export const exportRequestSchema = z.object({
  exportType: z.enum(['NEOS', 'Full', 'Documents'])
});

export type ExportRequestInput = z.infer<typeof exportRequestSchema>;
