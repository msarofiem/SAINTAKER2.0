import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';
import fs from 'fs';
import path from 'path';

const server = http.createServer(app);

jest.mock('../utils/pdf', () => ({
  generatePdf: jest.fn().mockResolvedValue('/path/to/mock.pdf')
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    lead: {
      findUnique: jest.fn().mockResolvedValue({
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
      })
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
    }
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('POST /api/documents/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a document', async () => {
    const res = await request(server).post('/api/documents/generate')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'mock-id',
        documentType: 'Retainer'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document).toBeDefined();
    expect(res.body.data.downloadUrl).toBeDefined();
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockImplementation(() => null);
    
    const res = await request(server).post('/api/documents/generate')
      .set('Authorization', 'Bearer mock-token')
      .send({
        leadId: 'non-existent-id',
        documentType: 'Retainer'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/documents/:documentId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle requests without token', async () => {
    const res = await request(server).get('/api/documents/doc-id');
    
    expect(res.statusCode).toEqual(500);
  });

  it('should return 404 for non-existent document', async () => {
    prisma.upload.findUnique = jest.fn().mockImplementation(() => null);
    
    const res = await request(server).get('/api/documents/non-existent-id?token=mock-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
