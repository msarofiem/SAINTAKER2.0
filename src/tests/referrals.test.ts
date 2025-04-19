import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue({ messageId: 'mock-message-id' })
}));

jest.mock('../utils/pdf', () => ({
  generatePdf: jest.fn().mockResolvedValue('/path/to/mock.pdf')
}));

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    lead: {
      findUnique: jest.fn().mockImplementation((params) => {
        if (params?.where?.id === 'mock-id') {
          return {
            id: 'mock-id',
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '1234567890',
            email: 'john@example.com',
            dateOfAccident: new Date(),
            typeOfAccident: 'Auto',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zip: '10001'
            },
            injuries: [{ bodyPart: 'Back' }]
          };
        }
        return null; // Return null for non-existent leads
      }),
      update: jest.fn().mockImplementation(() => ({
        id: 'mock-id',
        status: 'Referred'
      }))
    },
    upload: {
      create: jest.fn().mockImplementation(() => ({
        id: 'doc-id',
        fileName: 'test.pdf',
        fileType: 'application/pdf',
        fileUrl: '/uploads/test.pdf'
      }))
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('POST /api/referrals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a referral', async () => {
    const res = await request(server).post('/api/referrals')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'mock-id',
        attorneyName: 'Jane Smith',
        attorneyEmail: 'jane@example.com',
        attorneyPhone: '9876543210',
        notes: 'Please handle this case'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockImplementation(() => null);
    
    const res = await request(server).post('/api/referrals')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'non-existent-id',
        attorneyName: 'Jane Smith',
        attorneyEmail: 'jane@example.com'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/referrals/reject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject a lead', async () => {
    prisma.lead.findUnique = jest.fn().mockImplementation((params) => {
      if (params?.where?.id === 'mock-id') {
        return {
          id: 'mock-id',
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '1234567890',
          email: 'john@example.com',
          dateOfAccident: new Date(),
          typeOfAccident: 'Auto',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          },
          injuries: [{ bodyPart: 'Back' }]
        };
      }
      return null;
    });
    
    const res = await request(server).post('/api/referrals/reject')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'mock-id',
        reason: 'Case outside our practice area',
        sendEmail: true,
        notes: 'Recommend contacting a workers comp attorney'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockImplementation(() => null);
    
    const res = await request(server).post('/api/referrals/reject')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'non-existent-id',
        reason: 'Case outside our practice area'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
