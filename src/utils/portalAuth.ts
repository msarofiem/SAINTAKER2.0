import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../app';

const SECRET_KEY = 'test-secret-key';

export const generatePortalToken = (leadId: string): string => {
  return jwt.sign({ leadId, type: 'portal' }, SECRET_KEY, { expiresIn: '7d' });
};

export const verifyPortalToken = (token: string): { leadId: string } => {
  const decoded = jwt.verify(token, SECRET_KEY) as { leadId: string, type: string };
  if (decoded.type !== 'portal') {
    throw new Error('Invalid token type');
  }
  return { leadId: decoded.leadId };
};

export const generatePortalPin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createPortalAccess = async (leadId: string): Promise<{ token: string, pin: string }> => {
  const token = generatePortalToken(leadId);
  const pin = generatePortalPin();
  
  await prisma.clientPortalAccess.upsert({
    where: { leadId },
    update: {
      token,
      pin,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    create: {
      leadId,
      token,
      pin,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
  
  return { token, pin };
};
