import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/portalAuth', () => ({
  createPortalAccess: jest.fn().mockResolvedValue({ token: 'mock-token', pin: '123456' }),
  verifyPortalToken: jest.fn().mockReturnValue({ leadId: 'mock-id' })
}));

describe('POST /api/portal/access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify portal access with valid PIN', async () => {
    prisma.clientPortalAccess.findUnique = jest.fn().mockResolvedValue({
      id: 'access-id',
      leadId: 'mock-id',
      token: 'mock-token',
      pin: '123456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      lead: {
        id: 'mock-id',
        firstName: 'John',
        lastName: 'Doe',
        status: 'New'
      }
    });
    
    prisma.clientPortalAccess.update = jest.fn().mockResolvedValue({});
    
    const res = await request(server).post('/api/portal/access')
      .send({
        leadId: 'mock-id',
        pin: '123456'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(prisma.clientPortalAccess.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.clientPortalAccess.update).toHaveBeenCalledTimes(1);
  });

  it('should return 401 for invalid PIN', async () => {
    prisma.clientPortalAccess.findUnique = jest.fn().mockResolvedValue({
      id: 'access-id',
      leadId: 'mock-id',
      token: 'mock-token',
      pin: '123456',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    
    const res = await request(server).post('/api/portal/access')
      .send({
        leadId: 'mock-id',
        pin: '654321'
      });

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/portal/:leadId/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return lead status with valid token', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'mock-id',
      firstName: 'John',
      lastName: 'Doe',
      status: 'New',
      chaseLogs: [
        { id: 'chase-1', type: 'Call', status: 'Completed', createdAt: new Date() }
      ],
      uploads: [
        { id: 'doc-1', fileName: 'test.pdf', documentType: 'ID', createdAt: new Date() }
      ]
    });
    
    const res = await request(server).get('/api/portal/mock-id/status')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead).toBeDefined();
    expect(res.body.data.timeline).toBeDefined();
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should return 401 with invalid token', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const res = await request(server).get('/api/portal/mock-id/status')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/portal/:leadId/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload document with valid token', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'mock-id',
      firstName: 'John',
      lastName: 'Doe'
    });
    
    prisma.upload.create = jest.fn().mockResolvedValue({
      id: 'upload-id',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileUrl: '/uploads/test.pdf',
      documentType: 'ID'
    });
    
    const res = await request(server).post('/api/portal/mock-id/upload')
      .set('Authorization', 'Bearer mock-token')
      .field('documentType', 'ID')
      .attach('file', Buffer.from('test file content'), 'test.pdf');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document).toBeDefined();
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
  });
});
