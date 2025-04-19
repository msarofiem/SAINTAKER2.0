import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const referralSchema = z.object({
  referredTo: z.string().min(1, 'Referred to is required'),
  email: z.string().email('Valid email is required'),
  phoneNumber: z.string().optional(),
  firm: z.string().optional(),
  reason: z.string().min(1, 'Reason for referral is required'),
  documentIds: z.array(z.string()).optional()
});

export type ReferralInput = z.infer<typeof referralSchema>;

export const validateReferralData = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = referralSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating referral data:', error);
    return res.status(500).json({
      success: false,
      error: 'Validation error'
    });
  }
};

export const referralFeedbackSchema = z.object({
  status: z.enum(['Pending', 'Accepted', 'Declined']),
  fee: z.number().optional(),
  comments: z.string().optional()
});

export type ReferralFeedbackInput = z.infer<typeof referralFeedbackSchema>;
