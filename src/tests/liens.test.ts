import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/pdf', () => ({
  generatePdf: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/templates/longworth', () => ({
  getLongworthTemplate: jest.fn().mockReturnValue('<h1>Longworth Letter</h1>')
}));

describe('POST /api/liens/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create lien record successfully', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe'
    });
    
    prisma.lienRecord.create = jest.fn().mockResolvedValue({
      id: 'lien-id',
      lienType: 'Medicare',
      lienHolder: 'Medicare',
      amount: 5000,
      status: 'pending',
      notes: 'Initial lien record',
      leadId: 'lead-id',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const res = await request(server).post('/api/liens/lead-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        lienType: 'Medicare',
        lienHolder: 'Medicare',
        amount: 5000,
        status: 'pending',
        notes: 'Initial lien record'
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lien).toBeDefined();
    expect(prisma.lienRecord.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/liens/non-existent-lead')
      .set('Authorization', 'Bearer valid-token')
      .send({
        lienType: 'Medicare',
        lienHolder: 'Medicare',
        amount: 5000,
        status: 'pending'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/liens/:lienId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update lien record successfully', async () => {
    prisma.lienRecord.findUnique = jest.fn().mockResolvedValue({
      id: 'lien-id',
      lienType: 'Medicare',
      lienHolder: 'Medicare',
      amount: 5000,
      status: 'pending',
      leadId: 'lead-id'
    });
    
    prisma.lienRecord.update = jest.fn().mockResolvedValue({
      id: 'lien-id',
      lienType: 'Medicare',
      lienHolder: 'Medicare',
      amount: 7500,
      status: 'negotiated',
      notes: 'Updated amount',
      leadId: 'lead-id',
      updatedAt: new Date()
    });
    
    const res = await request(server).put('/api/liens/lien-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        amount: 7500,
        status: 'negotiated',
        notes: 'Updated amount'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lien).toBeDefined();
    expect(res.body.data.lien.amount).toEqual(7500);
    expect(res.body.data.lien.status).toEqual('negotiated');
    expect(prisma.lienRecord.update).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lien', async () => {
    prisma.lienRecord.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).put('/api/liens/non-existent-lien')
      .set('Authorization', 'Bearer valid-token')
      .send({
        amount: 7500,
        status: 'negotiated'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/liens/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get all liens for a lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe'
    });
    
    prisma.lienRecord.findMany = jest.fn().mockResolvedValue([
      {
        id: 'lien-1',
        lienType: 'Medicare',
        lienHolder: 'Medicare',
        amount: 5000,
        status: 'pending',
        leadId: 'lead-id'
      },
      {
        id: 'lien-2',
        lienType: 'Medicaid',
        lienHolder: 'Medicaid',
        amount: 3000,
        status: 'received',
        leadId: 'lead-id'
      }
    ]);
    
    const res = await request(server).get('/api/liens/lead-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.liens).toBeDefined();
    expect(res.body.data.liens.length).toEqual(2);
    expect(prisma.lienRecord.findMany).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).get('/api/liens/non-existent-lead')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/liens/:leadId/longworth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate Longworth letter successfully', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      hasUmUimCoverage: true,
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      }
    });
    
    prisma.upload.create = jest.fn().mockResolvedValue({
      id: 'doc-id',
      fileName: 'longworth_Doe_1234567890.pdf',
      fileType: 'application/pdf',
      fileUrl: '/uploads/longworth_Doe_1234567890.pdf',
      documentType: 'Longworth',
      leadId: 'lead-id'
    });
    
    const res = await request(server).post('/api/liens/lead-id/longworth')
      .set('Authorization', 'Bearer valid-token')
      .send({
        insuranceCarrier: 'ABC Insurance',
        policyNumber: 'POL123456',
        tortfeasorLimit: '$25,000'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document).toBeDefined();
    expect(prisma.upload.create).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).post('/api/liens/non-existent-lead/longworth')
      .set('Authorization', 'Bearer valid-token')
      .send({
        insuranceCarrier: 'ABC Insurance',
        policyNumber: 'POL123456',
        tortfeasorLimit: '$25,000'
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for lead without UM/UIM coverage', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      hasUmUimCoverage: false
    });
    
    const res = await request(server).post('/api/liens/lead-id/longworth')
      .set('Authorization', 'Bearer valid-token')
      .send({
        insuranceCarrier: 'ABC Insurance',
        policyNumber: 'POL123456',
        tortfeasorLimit: '$25,000'
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });
});
