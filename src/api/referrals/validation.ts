import { z } from 'zod';

export const referralSchema = z.object({
  leadId: z.string().uuid(),
  attorneyName: z.string().min(1, 'Attorney name is required'),
  attorneyEmail: z.string().email('Valid attorney email is required'),
  attorneyPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const rejectionSchema = z.object({
  leadId: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required'),
  sendEmail: z.boolean().default(true),
  notes: z.string().optional(),
});

export type ReferralInput = z.infer<typeof referralSchema>;
export type RejectionInput = z.infer<typeof rejectionSchema>;
