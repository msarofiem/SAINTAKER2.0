import { Request, Response, NextFunction } from 'express';
import { shortFormLeadSchema } from './validation';
import { ZodError } from 'zod';

export const validateShortFormLead = (req: Request, res: Response, next: NextFunction) => {
  try {
    shortFormLeadSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Internal server error during validation'
    });
  }
};
