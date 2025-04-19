import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';
import fs from 'fs';
import path from 'path';

const server = http.createServer(app);

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn().mockReturnValue({
    pipe: jest.fn(),
    on: jest.fn().mockImplementation(function(event, callback) {
      if (event === 'finish') callback();
      return this;
    })
  }),
  createReadStream: jest.fn().mockReturnValue({
    pipe: jest.fn()
  }),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn()
}));

jest.mock('archiver', () => {
  return jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    finalize: jest.fn().mockResolvedValue(undefined)
  }));
});

jest.mock('../utils/auth', () => ({
  generateDocumentToken: jest.fn().mockReturnValue('mock-token'),
  verifyDocumentToken: jest.fn().mockReturnValue({ documentId: 'export-id' })
}));

describe('POST /api/exports/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate export successfully', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '1234567890',
      email: 'john@example.com',
      dateOfAccident: new Date(),
      typeOfAccident: 'Auto',
      status: 'New',
      address: { street: '123 Main St', city: 'New York', state: 'NY', zip: '10001' },
      injuries: [{ bodyPart: 'Back', description: 'Pain' }],
      uploads: [
        { id: 'doc-1', fileName: 'test.pdf', fileUrl: '/uploads/test.pdf', documentType: 'ID' }
      ],
      liens: []
    });
    
    prisma.upload.create = jest.fn().mockResolvedValue({
      id: 'export-id',
      fileName: 'Doe_John_1234567890.zip',
      fileType: 'application/zip',
      fileUrl: '/exports/Doe_John_1234567890.zip',
      documentType: 'Export'
    });
    
    const res = await request(server).post('/api/exports/lead-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        exportType: 'NEOS'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.export).toBeDefined();
    expect(res.body.data.downloadUrl).toBeDefined();
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/exports/non-existent-lead')
      .set('Authorization', 'Bearer valid-token')
      .send({
        exportType: 'NEOS'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/exports/:exportId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should download export successfully', async () => {
    prisma.upload.findUnique = jest.fn().mockResolvedValue({
      id: 'export-id',
      fileName: 'Doe_John_1234567890.zip',
      fileType: 'application/zip',
      fileUrl: '/exports/Doe_John_1234567890.zip',
      documentType: 'Export'
    });
    
    const res = await request(server).get('/api/exports/export-id')
      .query({ token: 'mock-token' });

    expect(res.statusCode).toEqual(200);
    expect(prisma.upload.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should return 401 without token', async () => {
    const res = await request(server).get('/api/exports/export-id');

    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for non-existent export', async () => {
    prisma.upload.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).get('/api/exports/non-existent-export')
      .query({ token: 'mock-token' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
