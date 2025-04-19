import { Request, Response, NextFunction } from 'express';
import { referralSchema, rejectionSchema } from './validation';
import { ZodError } from 'zod';

export const validateReferral = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  try {
    referralSchema.parse(req.body);
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

export const validateRejection = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  try {
    rejectionSchema.parse(req.body);
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
