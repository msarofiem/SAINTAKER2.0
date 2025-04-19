import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    lead: {
      create: jest.fn().mockResolvedValue({
        id: 'mock-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '1234567890',
        language: 'English',
        address: {
          street: '123 Main',
          city: 'Jersey City',
          state: 'NJ',
          zip: '07306'
        },
        injuries: [{ bodyPart: 'Neck' }],
        priorAttorney: { spokenTo: false },
        uploads: [],
        chaseLogs: []
      }),
    },
    chaseLog: {
      createMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('POST /api/intake/shortform', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new lead', async () => {
    const res = await request(server).post('/api/intake/shortform')
      .set('Authorization', 'Bearer mock-token')
      .send({
        firstName: 'John', 
        lastName: 'Doe', 
        phoneNumber: '1234567890', 
        language: 'English',
        address: { 
          street: '123 Main', 
          city: 'Jersey City', 
          state: 'NJ', 
          zip: '07306' 
        },
        typeOfAccident: 'Auto', 
        dateOfAccident: '2024-01-01', 
        injuryBodyParts: ['Neck'],
        policeInvolved: true, 
        insurance: 'Geico', 
        priorAttorney: { spokenTo: false }, 
        uploads: []
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(prisma.lead.create).toHaveBeenCalledTimes(1);
    expect(prisma.chaseLog.createMany).toHaveBeenCalledTimes(1);
  });

  it('should return validation error for missing required fields', async () => {
    const res = await request(server).post('/api/intake/shortform')
      .set('Authorization', 'Bearer mock-token')
      .send({
        firstName: 'John',
        phoneNumber: '1234567890'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Validation error');
  });
});
