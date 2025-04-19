import { Request, Response, NextFunction } from 'express';
import { exportRequestSchema } from './validation';

export const validateExportRequest = (req: Request, res: Response, next: NextFunction) => {
  try {
    exportRequestSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};
