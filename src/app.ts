import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import intakeRoutes from './api/intake/routes';
import documentsRoutes from './api/documents/routes';
import referralsRoutes from './api/referrals/routes';
import authRoutes from './api/auth/routes';
import dashboardRoutes from './api/dashboard/routes';

export const prisma = process.env.NODE_ENV === 'test' 
  ? {
      lead: {
        create: jest.fn().mockResolvedValue({ id: 'mock-id' }),
        findUnique: jest.fn().mockImplementation((params) => {
          if (params?.where?.id === 'mock-id') {
            return Promise.resolve({ 
              id: 'mock-id', 
              firstName: 'John', 
              lastName: 'Doe',
              phoneNumber: '1234567890',
              email: 'john@example.com',
              dateOfAccident: new Date(),
              typeOfAccident: 'Auto',
              status: 'New',
              address: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' },
              injuries: [{ bodyPart: 'Back', description: 'Pain' }],
              priorAttorney: { spokenTo: false }
            });
          }
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 'mock-id-1', firstName: 'John', lastName: 'Doe', status: 'New', createdAt: new Date() },
          { id: 'mock-id-2', firstName: 'Jane', lastName: 'Smith', status: 'In Progress', createdAt: new Date() }
        ]),
        update: jest.fn().mockResolvedValue({ id: 'mock-id', status: 'Updated' }),
        count: jest.fn().mockResolvedValue(2),
        groupBy: jest.fn().mockResolvedValue([
          { source: 'Website', _count: 3 },
          { source: 'Referral', _count: 2 }
        ])
      },
      upload: {
        create: jest.fn().mockResolvedValue({
          id: 'doc-id',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          fileUrl: '/uploads/test.pdf'
        }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'doc-id',
          fileName: 'test.pdf',
          fileType: 'application/pdf',
          fileUrl: '/uploads/test.pdf'
        })
      },
      address: {
        create: jest.fn().mockResolvedValue({ id: 'address-id' })
      },
      injury: {
        createMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      priorAttorney: {
        create: jest.fn().mockResolvedValue({ id: 'attorney-id' })
      },
      chaseLog: {
        create: jest.fn().mockResolvedValue({ id: 'chase-id' }),
        createMany: jest.fn().mockResolvedValue({ count: 3 })
      },
      $queryRaw: jest.fn().mockResolvedValue([
        { date: '2023-07-01', count: 2 },
        { date: '2023-07-02', count: 1 }
      ])
    } 
  : new PrismaClient();

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

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
