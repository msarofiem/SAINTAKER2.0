import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/auth', () => ({
  generateDocumentToken: jest.fn().mockReturnValue('mock-token'),
  verifyDocumentToken: jest.fn().mockReturnValue({ documentId: 'doc-id' })
}));

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('POST /api/signatures/request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a signature request successfully', async () => {
    prisma.upload.findUnique = jest.fn().mockResolvedValue({
      id: 'doc-id',
      fileName: 'test.pdf',
      fileType: 'application/pdf',
      fileUrl: '/uploads/test.pdf',
      lead: {
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }
    });
    
    prisma.documentSignature.create = jest.fn().mockResolvedValue({
      id: 'sig-id',
      status: 'pending',
      signatureToken: 'mock-token',
      documentId: 'doc-id',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const res = await request(server).post('/api/signatures/request')
      .set('Authorization', 'Bearer valid-token')
      .send({
        documentId: 'doc-id',
        recipientEmail: 'john@example.com'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signature).toBeDefined();
    expect(res.body.data.signatureUrl).toBeDefined();
    expect(prisma.documentSignature.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent document', async () => {
    prisma.upload.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/signatures/request')
      .set('Authorization', 'Bearer valid-token')
      .send({
        documentId: 'non-existent-doc',
        recipientEmail: 'john@example.com'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/signatures/:signatureId/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update signature status successfully', async () => {
    prisma.documentSignature.findUnique = jest.fn().mockResolvedValue({
      id: 'sig-id',
      status: 'pending',
      signatureToken: 'mock-token',
      documentId: 'doc-id'
    });
    
    prisma.documentSignature.update = jest.fn().mockResolvedValue({
      id: 'sig-id',
      status: 'signed',
      signatureToken: 'mock-token',
      documentId: 'doc-id',
      signedAt: new Date(),
      ipAddress: '127.0.0.1',
      signerName: 'John Doe'
    });
    
    const res = await request(server).post('/api/signatures/sig-id/status')
      .set('Authorization', 'Bearer valid-token')
      .send({
        status: 'signed',
        signerName: 'John Doe'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signature.status).toEqual('signed');
    expect(prisma.documentSignature.update).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent signature', async () => {
    prisma.documentSignature.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/signatures/non-existent-sig/status')
      .set('Authorization', 'Bearer valid-token')
      .send({
        status: 'signed',
        signerName: 'John Doe'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/signatures/:signatureId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get signature status successfully', async () => {
    prisma.documentSignature.findUnique = jest.fn().mockResolvedValue({
      id: 'sig-id',
      status: 'signed',
      signatureToken: 'mock-token',
      documentId: 'doc-id',
      signedAt: new Date(),
      document: {
        id: 'doc-id',
        fileName: 'test.pdf',
        lead: {
          id: 'lead-id',
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    });
    
    const res = await request(server).get('/api/signatures/sig-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.signature).toBeDefined();
    expect(prisma.documentSignature.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent signature', async () => {
    prisma.documentSignature.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).get('/api/signatures/non-existent-sig')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
