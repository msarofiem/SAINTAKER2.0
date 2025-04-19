import { PrismaClient } from '@prisma/client';

export const prisma = {
  lead: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  address: {
    create: jest.fn(),
    update: jest.fn()
  },
  injury: {
    createMany: jest.fn()
  },
  upload: {
    createMany: jest.fn()
  },
  chaseLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  intakeEvaluation: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn()
  },
  litigationAssessment: {
    create: jest.fn(),
    upsert: jest.fn(),
    findUnique: jest.fn()
  },
  referralPartner: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  referral: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  referralMatch: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  $connect: jest.fn(),
  $disconnect: jest.fn()
};

jest.mock('../app', () => ({
  __esModule: true,
  default: {},
  prisma: prisma
}));

export const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE2MTYxNjI4MDAsImV4cCI6MTYxNjc2NzYwMH0.mock-signature';
