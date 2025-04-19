import request from 'supertest';
import express from 'express';
import { prisma } from './test-utils';
import referralsRoutes from '../api/referrals/routes';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = { userId: 'test-user-id' };
  next();
});

app.use('/api/referrals', referralsRoutes);

jest.mock('../app', () => ({
  prisma
}));

describe('Referral Matcher API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.lead.findUnique.mockResolvedValue({
      id: 'test-lead-id',
      firstName: 'Test',
      lastName: 'User',
      language: 'Spanish',
      typeOfAccident: 'Auto',
      address: { zip: '12345' }
    });

    prisma.referralPartner.findMany.mockResolvedValue([
      {
        id: 'partner-1',
        name: 'Perfect Match Partner',
        email: 'perfect@example.com',
        phone: '555-123-4567',
        specialty: ['Auto'],
        zip: ['12345'],
        languages: ['Spanish'],
        feeSplitRatio: 40,
        responsiveness: 100,
        active: true
      },
      {
        id: 'partner-2',
        name: 'Partial Match Partner',
        email: 'partial@example.com',
        phone: '555-987-6543',
        specialty: ['Auto'],
        zip: ['67890'],
        languages: ['Spanish'],
        feeSplitRatio: 35,
        responsiveness: 90,
        active: true
      },
      {
        id: 'partner-3',
        name: 'Poor Match Partner',
        email: 'poor@example.com',
        phone: '555-555-5555',
        specialty: ['Medical Malpractice'],
        zip: ['67890'],
        languages: ['English'],
        feeSplitRatio: 30,
        responsiveness: 80,
        active: true
      }
    ]);

    prisma.referralPartner.findUnique.mockResolvedValue({
      id: 'partner-1',
      name: 'Perfect Match Partner',
      email: 'perfect@example.com',
      phone: '555-123-4567',
      specialty: ['Auto'],
      zip: ['12345'],
      languages: ['Spanish'],
      feeSplitRatio: 40,
      responsiveness: 100,
      active: true
    });

    prisma.referral.create.mockResolvedValue({
      id: 'test-referral-id',
      leadId: 'test-lead-id',
      referredTo: 'Perfect Match Partner',
      email: 'perfect@example.com',
      phoneNumber: '555-123-4567',
      notes: 'Test notes',
      referralDate: new Date()
    });

    prisma.referralMatch.create.mockResolvedValue({
      id: 'test-match-id',
      referralId: 'test-referral-id',
      partnerId: 'partner-1',
      matchQuality: 100,
      notes: 'Test notes',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prisma.lead.update.mockResolvedValue({
      id: 'test-lead-id',
      status: 'Referred - Pending'
    });
  });

  it('should find matches for a lead', async () => {
    const res = await request(app)
      .get('/api/referrals/matches/test-lead-id')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.matches).toBeDefined();
    expect(prisma.lead.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.referralPartner.findMany).toHaveBeenCalledTimes(1);
  });

  it('should return 404 for non-existent lead', async () => {
    prisma.lead.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/referrals/matches/non-existent-id')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Lead not found');
  });

  it('should create a referral match', async () => {
    const res = await request(app)
      .post('/api/referrals/matches/test-lead-id/partner-1')
      .set('Authorization', 'Bearer mock-token')
      .send({ notes: 'Test notes' });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(prisma.referral.create).toHaveBeenCalledTimes(1);
    expect(prisma.referralMatch.create).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledTimes(1);
    expect(prisma.lead.update).toHaveBeenCalledWith({
      where: { id: 'test-lead-id' },
      data: { status: 'Referred - Pending' }
    });
  });

  it('should return 404 for non-existent lead when creating match', async () => {
    prisma.lead.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/referrals/matches/non-existent-id/partner-1')
      .set('Authorization', 'Bearer mock-token')
      .send({ notes: 'Test notes' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Lead not found');
    expect(prisma.referral.create).not.toHaveBeenCalled();
  });

  it('should return 404 for non-existent partner when creating match', async () => {
    prisma.referralPartner.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/referrals/matches/test-lead-id/non-existent-id')
      .set('Authorization', 'Bearer mock-token')
      .send({ notes: 'Test notes' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Referral partner not found');
    expect(prisma.referral.create).not.toHaveBeenCalled();
  });
});
