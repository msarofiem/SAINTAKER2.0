import { PrismaClient } from '@prisma/client';
import { jest } from '@jest/globals';

// Define a type-safe mock object
const mockPrisma: Record<string, any> = {
  lead: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn()
  },
  address: {
    create: jest.fn()
  },
  injury: {
    createMany: jest.fn()
  },
  upload: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  chaseLog: {
    create: jest.fn(),
    findMany: jest.fn()
  },
  clientTouchpoint: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  referral: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  referralFeedback: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn()
  },
  documentSignature: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  intakeEvaluation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  carrierAccess: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  $queryRawUnsafe: jest.fn(),
  $transaction: jest.fn((callback: (prisma: any) => any) => callback(mockPrisma))
};

// Cast to PrismaClient for type compatibility
export const mockPrismaClient = mockPrisma as unknown as PrismaClient;

// Function to reset all mocks
export const mockReset = (): void => {
  Object.keys(mockPrisma).forEach((key: string) => {
    const value = mockPrisma[key];
    if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach((method: string) => {
        const fn = value[method];
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset();
        }
      });
    } else if (typeof value === 'function' && value.mockReset) {
      value.mockReset();
    }
  });
};

// Export a mock constructor for PrismaClient
export default { 
  PrismaClient: jest.fn(() => mockPrisma) 
};
