import { Request, Response, NextFunction } from 'express';
import { documentGenerationSchema } from './validation';
import { ZodError } from 'zod';
import { verifyDocumentToken } from '../../utils/auth';

export const validateDocumentGeneration = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  try {
    documentGenerationSchema.parse(req.body);
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

export const verifyDocumentAccess = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const { documentId } = verifyDocumentToken(token as string);
    
    if (documentId !== req.params.documentId) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token for this document'
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
