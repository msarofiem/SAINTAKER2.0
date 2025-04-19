import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

export const carrierAccessSchema = z.object({
  carrierName: z.string().min(1, 'Carrier name is required'),
  carrierEmail: z.string().email('Valid email is required')
});

export type CarrierAccessInput = z.infer<typeof carrierAccessSchema>;

export const validateCarrierAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = carrierAccessSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.errors
      });
    }
    
    next();
  } catch (error) {
    console.error('Error validating carrier access data:', error);
    return res.status(500).json({
      success: false,
      error: 'Validation error'
    });
  }
};
