import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

describe('POST /api/staff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new staff member', async () => {
    prisma.staffMember.create = jest.fn().mockResolvedValue({
      id: 'staff-id',
      name: 'Jane Smith',
      email: 'jane@example.com',
      languages: ['English', 'Spanish'],
      isActive: true
    });
    
    const res = await request(server).post('/api/staff')
      .set('Authorization', 'Bearer valid-token')
      .send({
        name: 'Jane Smith',
        email: 'jane@example.com',
        languages: ['English', 'Spanish']
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toEqual('Jane Smith');
    expect(prisma.staffMember.create).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/staff/assign/:leadId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should manually assign a lead to staff', async () => {
    prisma.staffAssignment.findUnique = jest.fn().mockResolvedValue(null);
    
    prisma.lead.findUnique = jest.fn().mockResolvedValue({
      id: 'lead-id',
      firstName: 'John',
      lastName: 'Doe',
      language: 'English'
    });
    
    prisma.staffAssignment.create = jest.fn().mockResolvedValue({
      id: 'assignment-id',
      leadId: 'lead-id',
      staffId: 'staff-id',
      isActive: true,
      language: 'English',
      assignedAt: new Date(),
      staff: {
        id: 'staff-id',
        name: 'Jane Smith'
      },
      lead: {
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe'
      }
    });
    
    const res = await request(server).post('/api/staff/assign/lead-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        staffId: 'staff-id',
        manual: true
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.staffId).toEqual('staff-id');
    expect(prisma.staffAssignment.create).toHaveBeenCalledTimes(1);
  });
});

describe('PUT /api/staff/auto-assign', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should toggle auto-assignment setting', async () => {
    const res = await request(server).put('/api/staff/auto-assign')
      .set('Authorization', 'Bearer valid-token')
      .send({
        enabled: true
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.autoAssignEnabled).toBe(true);
  });
});
