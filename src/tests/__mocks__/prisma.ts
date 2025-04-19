export const PrismaClient = jest.fn().mockImplementation(() => ({
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
    findMany: jest.fn()
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
}));

export default {
  PrismaClient
};
