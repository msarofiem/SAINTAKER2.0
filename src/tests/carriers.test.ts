import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-token'),
  verifyToken: jest.fn().mockReturnValue({ leadId: 'lead-id', carrierEmail: 'carrier@example.com' })
}));

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('POST /api/carriers/access/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create carrier access and send email', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe'
    });
    
    prisma.carrierAccess.findFirst = jest.fn().mockResolvedValue(null);
    
    prisma.carrierAccess.create = jest.fn().mockResolvedValue({
      id: 'access-id',
      leadId: 'lead-id',
      carrierName: 'ABC Insurance',
      carrierEmail: 'carrier@example.com',
      accessToken: 'mock-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    const res = await request(server).post('/api/carriers/access/lead-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        carrierName: 'ABC Insurance',
        carrierEmail: 'carrier@example.com'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessUrl).toBeDefined();
    expect(res.body.data.emailSent).toBe(true);
    expect(prisma.carrierAccess.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/carriers/access/non-existent-lead')
      .set('Authorization', 'Bearer valid-token')
      .send({
        carrierName: 'ABC Insurance',
        carrierEmail: 'carrier@example.com'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/carriers/verify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify valid carrier access token', async () => {
    prisma.carrierAccess.findFirst = jest.fn().mockResolvedValue({
      id: 'access-id',
      leadId: 'lead-id',
      carrierName: 'ABC Insurance',
      carrierEmail: 'carrier@example.com',
      accessToken: 'mock-token',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lead: {
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe',
        status: 'Active'
      }
    });
    
    prisma.carrierAccess.update = jest.fn().mockResolvedValue({});
    
    const res = await request(server).get('/api/carriers/verify')
      .query({ token: 'mock-token' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.carrierAccess).toBeDefined();
    expect(res.body.data.lead).toBeDefined();
    expect(prisma.carrierAccess.update).toHaveBeenCalledTimes(1);
  });

  it('should return 401 for invalid token', async () => {
    prisma.carrierAccess.findFirst = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).get('/api/carriers/verify')
      .query({ token: 'invalid-token' });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});
