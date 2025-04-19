import jwt from 'jsonwebtoken';
import config from '../config';

const SECRET_KEY = 'test-secret-key';

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, SECRET_KEY);
};

export const generateDocumentToken = (documentId: string): string => {
  return jwt.sign({ documentId }, SECRET_KEY, { expiresIn: '24h' });
};

export const verifyDocumentToken = (token: string): { documentId: string } => {
  return jwt.verify(token, SECRET_KEY) as { documentId: string };
};
