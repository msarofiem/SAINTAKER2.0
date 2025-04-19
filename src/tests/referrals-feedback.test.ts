import request from 'supertest';
import http from 'http';
import app from '../app';
import { prisma } from '../app';

const server = http.createServer(app);

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../scheduler/touchpointScheduler', () => ({
  scheduleReferralReminderTouchpoint: jest.fn().mockResolvedValue(true)
}));

jest.mock('../sockets/notificationSocket', () => ({
  emitReferralFeedbackNotification: jest.fn().mockResolvedValue(true)
}));

describe('GET /api/referrals/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get referral status with feedback', async () => {
    prisma.referral.findMany = jest.fn().mockResolvedValue([
      {
        id: 'referral-id',
        leadId: 'lead-id',
        referredTo: 'John Smith',
        email: 'john@example.com',
        referralDate: new Date(),
        lead: {
          id: 'lead-id',
          firstName: 'Jane',
          lastName: 'Doe',
          status: 'Referred - Pending'
        },
        feedback: {
          id: 'feedback-id',
          referralId: 'referral-id',
          status: 'Pending',
          lastReminderAt: new Date()
        }
      }
    ]);
    
    const res = await request(server).get('/api/referrals/status')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].feedback).toBeDefined();
    expect(prisma.referral.findMany).toHaveBeenCalledTimes(1);
  });
});

describe('PUT /api/referrals/feedback/:referralId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update referral feedback', async () => {
    prisma.referral.findUnique = jest.fn().mockResolvedValue({
      id: 'referral-id',
      leadId: 'lead-id',
      referredTo: 'John Smith',
      email: 'john@example.com',
      referralDate: new Date(),
      feedback: {
        id: 'feedback-id',
        status: 'Pending'
      },
      lead: {
        id: 'lead-id',
        firstName: 'Jane',
        lastName: 'Doe',
        status: 'Referred - Pending'
      }
    });
    
    prisma.referralFeedback.update = jest.fn().mockResolvedValue({
      id: 'feedback-id',
      referralId: 'referral-id',
      status: 'Accepted',
      fee: 1000,
      comments: 'Great case',
      responseAt: new Date()
    });
    
    prisma.lead.update = jest.fn().mockResolvedValue({
      id: 'lead-id',
      status: 'Referred - Accepted'
    });
    
    const res = await request(server).put('/api/referrals/feedback/referral-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        status: 'Accepted',
        fee: 1000,
        comments: 'Great case'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('Accepted');
    expect(prisma.referralFeedback.update).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
  });

  it('should create new feedback if none exists', async () => {
    prisma.referral.findUnique = jest.fn().mockResolvedValue({
      id: 'referral-id',
      leadId: 'lead-id',
      referredTo: 'John Smith',
      email: 'john@example.com',
      referralDate: new Date(),
      feedback: null,
      lead: {
        id: 'lead-id',
        firstName: 'Jane',
        lastName: 'Doe',
        status: 'Referred - Pending'
      }
    });
    
    prisma.referralFeedback.create = jest.fn().mockResolvedValue({
      id: 'feedback-id',
      referralId: 'referral-id',
      status: 'Declined',
      comments: 'Not our area of practice',
      responseAt: new Date()
    });
    
    prisma.lead.update = jest.fn().mockResolvedValue({
      id: 'lead-id',
      status: 'Referred - Declined'
    });
    
    const res = await request(server).put('/api/referrals/feedback/referral-id')
      .set('Authorization', 'Bearer valid-token')
      .send({
        status: 'Declined',
        comments: 'Not our area of practice'
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toEqual('Declined');
    expect(prisma.referralFeedback.create).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/referrals/reminder/:referralId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send referral reminder', async () => {
    prisma.referral.findUnique = jest.fn().mockResolvedValue({
      id: 'referral-id',
      leadId: 'lead-id',
      referredTo: 'John Smith',
      email: 'john@example.com',
      referralDate: new Date(),
      feedback: {
        id: 'feedback-id',
        status: 'Pending'
      },
      lead: {
        id: 'lead-id',
        firstName: 'Jane',
        lastName: 'Doe'
      }
    });
    
    prisma.referralFeedback.update = jest.fn().mockResolvedValue({
      id: 'feedback-id',
      referralId: 'referral-id',
      status: 'Pending',
      lastReminderAt: new Date()
    });
    
    const res = await request(server).post('/api/referrals/reminder/referral-id')
      .set('Authorization', 'Bearer valid-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.emailSent).toBe(true);
    expect(prisma.referralFeedback.update).toHaveBeenCalledTimes(1);
  });
});
