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

describe('Referral Partners API', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    prisma.referralPartner.findUnique.mockResolvedValue(null);
    prisma.referralPartner.create.mockResolvedValue({
      id: 'test-partner-id',
      name: 'Test Partner',
      email: 'partner@example.com',
      phone: '555-123-4567',
      specialty: ['Auto', 'Slip & Fall'],
      zip: ['12345', '67890'],
      languages: ['English', 'Spanish'],
      feeSplitRatio: 40,
      responsiveness: 100,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    prisma.referralPartner.findMany.mockResolvedValue([
      {
        id: 'test-partner-id',
        name: 'Test Partner',
        email: 'partner@example.com',
        phone: '555-123-4567',
        specialty: ['Auto', 'Slip & Fall'],
        zip: ['12345', '67890'],
        languages: ['English', 'Spanish'],
        feeSplitRatio: 40,
        responsiveness: 100,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  });

  it('should create a new referral partner', async () => {
    const res = await request(app)
      .post('/api/referrals/partners')
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'Test Partner',
        email: 'partner@example.com',
        phone: '555-123-4567',
        specialty: ['Auto', 'Slip & Fall'],
        zip: ['12345', '67890'],
        languages: ['English', 'Spanish'],
        feeSplitRatio: 40
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(prisma.referralPartner.create).toHaveBeenCalledTimes(1);
  });

  it('should return 400 if partner with email already exists', async () => {
    prisma.referralPartner.findUnique.mockResolvedValueOnce({
      id: 'existing-partner-id',
      email: 'partner@example.com'
    });

    const res = await request(app)
      .post('/api/referrals/partners')
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'Test Partner',
        email: 'partner@example.com',
        specialty: ['Auto', 'Slip & Fall'],
        zip: ['12345', '67890'],
        languages: ['English', 'Spanish'],
        feeSplitRatio: 40
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(prisma.referralPartner.create).not.toHaveBeenCalled();
  });

  it('should get all referral partners', async () => {
    const res = await request(app)
      .get('/api/referrals/partners')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(prisma.referralPartner.findMany).toHaveBeenCalledTimes(1);
  });

  it('should get a specific referral partner by ID', async () => {
    prisma.referralPartner.findUnique.mockResolvedValueOnce({
      id: 'test-partner-id',
      name: 'Test Partner',
      email: 'partner@example.com',
      phone: '555-123-4567',
      specialty: ['Auto', 'Slip & Fall'],
      zip: ['12345', '67890'],
      languages: ['English', 'Spanish'],
      feeSplitRatio: 40,
      responsiveness: 100,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app)
      .get('/api/referrals/partners/test-partner-id')
      .set('Authorization', 'Bearer mock-token');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('test-partner-id');
    expect(prisma.referralPartner.findUnique).toHaveBeenCalledTimes(1);
  });

  it('should update a referral partner', async () => {
    prisma.referralPartner.findUnique.mockResolvedValueOnce({
      id: 'test-partner-id',
      name: 'Test Partner',
      email: 'partner@example.com'
    });

    prisma.referralPartner.update.mockResolvedValueOnce({
      id: 'test-partner-id',
      name: 'Updated Partner',
      email: 'partner@example.com',
      phone: '555-987-6543',
      specialty: ['Auto', 'Medical Malpractice'],
      zip: ['12345', '67890'],
      languages: ['English', 'Spanish'],
      feeSplitRatio: 45,
      responsiveness: 90,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app)
      .put('/api/referrals/partners/test-partner-id')
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'Updated Partner',
        phone: '555-987-6543',
        specialty: ['Auto', 'Medical Malpractice'],
        feeSplitRatio: 45,
        responsiveness: 90
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Partner');
    expect(prisma.referralPartner.update).toHaveBeenCalledTimes(1);
  });

  it('should return 404 when updating non-existent partner', async () => {
    prisma.referralPartner.findUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .put('/api/referrals/partners/non-existent-id')
      .set('Authorization', 'Bearer mock-token')
      .send({
        name: 'Updated Partner',
        specialty: ['Auto']
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(prisma.referralPartner.update).not.toHaveBeenCalled();
  });
});
