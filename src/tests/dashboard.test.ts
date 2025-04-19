import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    lead: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'mock-id-1',
          firstName: 'John',
          lastName: 'Doe',
          status: 'New',
          createdAt: new Date()
        },
        {
          id: 'mock-id-2',
          firstName: 'Jane',
          lastName: 'Smith',
          status: 'In Progress',
          createdAt: new Date()
        }
      ]),
      count: jest.fn().mockResolvedValue(2),
      groupBy: jest.fn().mockResolvedValue([
        { source: 'Website', _count: 3 },
        { source: 'Referral', _count: 2 }
      ])
    },
    $queryRaw: jest.fn().mockResolvedValue([
      { date: '2023-07-01', count: 2 },
      { date: '2023-07-02', count: 1 }
    ])
  };
  
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  };
});

describe('GET /api/dashboard/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return leads with pagination', async () => {
    const res = await request(server).get('/api/dashboard/leads')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toBeDefined();
    expect(prisma.lead.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.lead.count).toHaveBeenCalledTimes(1);
  });

  it('should filter leads by status', async () => {
    const res = await request(server).get('/api/dashboard/leads?status=New')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(prisma.lead.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'New'
        })
      })
    );
  });
});

describe('GET /api/dashboard/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return dashboard metrics', async () => {
    const res = await request(server).get('/api/dashboard/metrics')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.totalLeads).toBeDefined();
    expect(res.body.data.leadsBySource).toBeDefined();
    expect(res.body.data.leadsByDay).toBeDefined();
  });
});
