import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import intakeRoutes from './api/intake/routes';
import documentsRoutes from './api/documents/routes';
import referralsRoutes from './api/referrals/routes';
import authRoutes from './api/auth/routes';
import dashboardRoutes from './api/dashboard/routes';
import portalRoutes from './api/portal/routes';
import signatureRoutes from './api/signatures/routes';
import exportRoutes from './api/exports/routes';
import lienRoutes from './api/liens/routes';
import analyticsRoutes from './api/analytics/routes';
import staffRoutes from './api/staff/routes';
import carrierRoutes from './api/carriers/routes';

export const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms - IP: ${req.ip} - User: ${req.headers['user-id'] || 'anonymous'}`);
  });
  next();
});

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  
  next();
};

app.use('/api/intake', authMiddleware, intakeRoutes);
app.use('/api/documents', authMiddleware, documentsRoutes);
app.use('/api/referrals', authMiddleware, referralsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/signatures', authMiddleware, signatureRoutes);
app.use('/api/exports', authMiddleware, exportRoutes);
app.use('/api/liens', authMiddleware, lienRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);
app.use('/api/staff', authMiddleware, staffRoutes);
app.use('/api/carriers', authMiddleware, carrierRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
