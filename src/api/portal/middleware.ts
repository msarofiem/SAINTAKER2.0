import { Request, Response, NextFunction } from 'express';
import { portalAccessSchema, documentUploadSchema } from './validation';
import { verifyPortalToken } from '../../utils/portalAuth';

export const validatePortalAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    portalAccessSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};

export const validateDocumentUpload = (req: Request, res: Response, next: NextFunction) => {
  try {
    documentUploadSchema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input'
    });
  }
};

export const verifyPortalAuthentication = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }
    
    const { leadId } = verifyPortalToken(token);
    req.params.leadId = leadId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};
