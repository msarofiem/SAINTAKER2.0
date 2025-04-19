import { sign, verify, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'sarofiem-antoun-secret-key';

export interface TokenPayload {
  leadId?: string;
  userId?: string;
  carrierEmail?: string;
  portalId?: string;
  documentId?: string;
  [key: string]: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Generate a JWT token with the provided payload
 */
export const generateToken = (payload: TokenPayload, expiresIn: string = '7d'): string => {
  return sign(payload as any, JWT_SECRET as any, { expiresIn } as any);
};

/**
 * Generate a document-specific token
 */
export const generateDocumentToken = (documentId: string, expiresIn: string = '24h'): string => {
  return generateToken({ documentId }, expiresIn);
};

/**
 * Verify a JWT token and return the decoded payload
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

/**
 * Verify a document token
 */
export const verifyDocumentToken = (token: string): TokenPayload | null => {
  return verifyToken(token);
};

/**
 * Middleware to verify JWT token in Authorization header
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: No token provided'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid token'
      });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Generate a random PIN code for portal access
 */
export const generatePIN = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0');
};
