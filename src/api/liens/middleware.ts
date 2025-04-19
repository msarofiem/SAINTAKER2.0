import { Request, Response, NextFunction } from 'express';
import { lienCreationSchema, lienUpdateSchema } from './validation';

export const validateLienCreation = (req: Request, res: Response, next: NextFunction) => {
  try {
    lienCreationSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};

export const validateLienUpdate = (req: Request, res: Response, next: NextFunction) => {
  try {
    lienUpdateSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};
