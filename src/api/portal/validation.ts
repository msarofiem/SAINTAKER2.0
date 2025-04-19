import { z } from 'zod';

export const portalAccessSchema = z.object({
  leadId: z.string().uuid(),
  pin: z.string().length(6)
});

export const documentUploadSchema = z.object({
  documentType: z.enum(['ID', 'CrashReport', 'SignedRetainer', 'Insurance']),
  description: z.string().optional()
});

export type PortalAccessInput = z.infer<typeof portalAccessSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
