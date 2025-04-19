import { Request, Response, NextFunction } from 'express';
import { signatureRequestSchema, signatureUpdateSchema } from './validation';

export const validateSignatureRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    signatureRequestSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};

export const validateSignatureUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    signatureUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};
