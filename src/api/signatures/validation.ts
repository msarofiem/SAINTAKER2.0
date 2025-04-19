import { z } from 'zod';

export const signatureRequestSchema = z.object({
  documentId: z.string().uuid(),
  recipientEmail: z.string().email()
});

export const signatureUpdateSchema = z.object({
  status: z.enum(['pending', 'signed', 'uploaded', 'failed']),
  signerName: z.string().optional()
});

export type SignatureRequestInput = z.infer<typeof signatureRequestSchema>;
export type SignatureUpdateInput = z.infer<typeof signatureUpdateSchema>;
