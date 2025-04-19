import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

describe('GET /api/analytics/heatmap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return conversion heatmap data by day (default)', async () => {
    prisma.$queryRaw = jest.fn().mockResolvedValue([
      { time_slot: 0, total: 10, converted: 5 },
      { time_slot: 1, total: 8, converted: 3 },
      { time_slot: 2, total: 12, converted: 7 }
    ]);
    
    const res = await request(server).get('/api/analytics/heatmap')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.period).toEqual('day');
    expect(res.body.data.conversionData).toBeDefined();
    expect(res.body.data.conversionData.length).toEqual(3);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('should return conversion heatmap data by hour', async () => {
    prisma.$queryRaw = jest.fn().mockResolvedValue([
      { time_slot: 9, total: 5, converted: 2 },
      { time_slot: 10, total: 8, converted: 4 },
      { time_slot: 11, total: 10, converted: 6 }
    ]);
    
    const res = await request(server).get('/api/analytics/heatmap?period=hour')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.period).toEqual('hour');
    expect(res.body.data.conversionData).toBeDefined();
    expect(res.body.data.conversionData.length).toEqual(3);
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('should return 400 for invalid period', async () => {
    const res = await request(server).get('/api/analytics/heatmap?period=invalid')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/analytics/timeline/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return lead timeline data', async () => {
    const mockDate = new Date();
    
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      status: 'In Progress',
      createdAt: mockDate,
      chaseLogs: [
        { 
          id: 'chase-1', 
          type: 'Call', 
          status: 'Completed', 
          createdAt: new Date(mockDate.getTime() + 3600000) 
        },
        { 
          id: 'chase-2', 
          type: 'Email', 
          status: 'Sent', 
          createdAt: new Date(mockDate.getTime() + 7200000) 
        }
      ],
      uploads: [
        { 
          id: 'doc-1', 
          fileName: 'id.pdf', 
          documentType: 'ID', 
          createdAt: new Date(mockDate.getTime() + 10800000),
          signatures: [
            {
              id: 'sig-1',
              status: 'signed',
              updatedAt: new Date(mockDate.getTime() + 14400000)
            }
          ]
        }
      ]
    });
    
    const res = await request(server).get('/api/analytics/timeline/lead-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.lead).toBeDefined();
    expect(res.body.data.timeline).toBeDefined();
    expect(res.body.data.timeline.length).toEqual(4); // lead created + 2 chase logs + 1 document
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique = jest.fn().mockResolvedValue(null);
    
    const res = await request(server).get('/api/analytics/timeline/non-existent-lead')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
  });
});
