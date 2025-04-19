import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const referralPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  specialty: z.array(z.string()).min(1, 'At least one specialty is required'),
  zip: z.array(z.string()).min(1, 'At least one zip code is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  feeSplitRatio: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
  responsiveness: z.number().min(0).max(100).optional()
});

export type ReferralPartnerInput = z.infer<typeof referralPartnerSchema>;

export const validateReferralPartner = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = referralPartnerSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating referral partner data:', error);
    return res.status(500).json({
      success: false,
      error: 'Validation error'
    });
  }
};

export const referralPartnerUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  phone: z.string().optional(),
  specialty: z.array(z.string()).min(1, 'At least one specialty is required').optional(),
  zip: z.array(z.string()).min(1, 'At least one zip code is required').optional(),
  languages: z.array(z.string()).min(1, 'At least one language is required').optional(),
  feeSplitRatio: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
  responsiveness: z.number().min(0).max(100).optional()
});

export type ReferralPartnerUpdateInput = z.infer<typeof referralPartnerUpdateSchema>;

export const validateReferralPartnerUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = referralPartnerUpdateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating referral partner update data:', error);
    return res.status(500).json({
      success: false,
      error: 'Validation error'
    });
  }
};
