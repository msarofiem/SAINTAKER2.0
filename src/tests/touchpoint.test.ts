import { scheduleLeadTouchpoints, schedulePostSignatureTouchpoint, scheduleReferralReminderTouchpoint } from '../scheduler/touchpointScheduler';
import { sendEmail } from '../utils/email';

// Mock dependencies
jest.mock('../app', () => {
  const mockPrisma = {
    lead: {
      findUnique: jest.fn()
    },
    clientTouchpoint: {
      createMany: jest.fn(),
      create: jest.fn()
    },
    referral: {
      findUnique: jest.fn()
    },
    referralFeedback: {
      create: jest.fn(),
      update: jest.fn()
    }
  };
  
  return {
    prisma: mockPrisma
  };
});

// Import prisma after mocking
import { prisma } from '../app';

jest.mock('../utils/twilio', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
  createTouchpointMessage: jest.fn().mockReturnValue('Test message')
}));

jest.mock('../utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

describe('Touchpoint Scheduler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleLeadTouchpoints', () => {
    it('should schedule 24h and 72h touchpoints for a lead', async () => {
      // Setup mocks
      (prisma.lead.findUnique as jest.Mock).mockResolvedValue({
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        typeOfAccident: 'Auto',
        dateOfAccident: new Date()
      });
      
      (prisma.clientTouchpoint.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      
      // Execute function
      const result = await scheduleLeadTouchpoints('lead-id');
      
      // Assertions
      expect(result).toBe(true);
      expect(prisma.lead.findUnique).toHaveBeenCalledWith({
        where: { id: 'lead-id' }
      });
      expect(prisma.clientTouchpoint.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.clientTouchpoint.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ type: 'SMS' }),
            expect.objectContaining({ type: 'SMS' })
          ])
        })
      );
    });
    
    it('should use email for leads without phone numbers', async () => {
      // Setup mocks
      (prisma.lead.findUnique as jest.Mock).mockResolvedValue({
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: null,
        email: 'john@example.com',
        typeOfAccident: 'Auto',
        dateOfAccident: new Date()
      });
      
      (prisma.clientTouchpoint.createMany as jest.Mock).mockResolvedValue({ count: 2 });
      
      // Execute function
      const result = await scheduleLeadTouchpoints('lead-id');
      
      // Assertions
      expect(result).toBe(true);
      expect(prisma.clientTouchpoint.createMany).toHaveBeenCalledTimes(1);
      expect(prisma.clientTouchpoint.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ type: 'Email' }),
            expect.objectContaining({ type: 'Email' })
          ])
        })
      );
    });
    
    it('should return false if lead not found', async () => {
      // Setup mocks
      (prisma.lead.findUnique as jest.Mock).mockResolvedValue(null);
      
      // Execute function
      const result = await scheduleLeadTouchpoints('non-existent-lead');
      
      // Assertions
      expect(result).toBe(false);
      expect(prisma.clientTouchpoint.createMany).not.toHaveBeenCalled();
    });
  });
  
  describe('schedulePostSignatureTouchpoint', () => {
    it('should schedule post-signature touchpoint', async () => {
      // Setup mocks
      (prisma.lead.findUnique as jest.Mock).mockResolvedValue({
        id: 'lead-id',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+1234567890',
        typeOfAccident: 'Auto',
        dateOfAccident: new Date()
      });
      
      (prisma.clientTouchpoint.create as jest.Mock).mockResolvedValue({
        id: 'touchpoint-id',
        leadId: 'lead-id',
        type: 'SMS',
        status: 'Pending',
        scheduledFor: new Date()
      });
      
      // Execute function
      const result = await schedulePostSignatureTouchpoint('lead-id');
      
      // Assertions
      expect(result).toBe(true);
      expect(prisma.clientTouchpoint.create).toHaveBeenCalledTimes(1);
      expect(prisma.clientTouchpoint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-id',
            type: 'SMS'
          })
        })
      );
    });
  });
  
  describe('scheduleReferralReminderTouchpoint', () => {
    it('should schedule referral reminder touchpoint', async () => {
      // Setup mocks
      (prisma.referral.findUnique as jest.Mock).mockResolvedValue({
        id: 'referral-id',
        leadId: 'lead-id',
        referredTo: 'John Smith',
        email: 'john@example.com',
        referralDate: new Date(),
        feedback: null,
        lead: {
          id: 'lead-id',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      });
      
      (prisma.referralFeedback.create as jest.Mock).mockResolvedValue({
        id: 'feedback-id',
        referralId: 'referral-id',
        status: 'Pending',
        lastReminderAt: new Date()
      });
      
      // Execute function
      const result = await scheduleReferralReminderTouchpoint('referral-id');
      
      // Assertions
      expect(result).toBe(true);
      expect(prisma.referralFeedback.create).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });
    
    it('should update existing feedback', async () => {
      // Setup mocks
      (prisma.referral.findUnique as jest.Mock).mockResolvedValue({
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
      
      (prisma.referralFeedback.update as jest.Mock).mockResolvedValue({
        id: 'feedback-id',
        referralId: 'referral-id',
        status: 'Pending',
        lastReminderAt: new Date()
      });
      
      // Execute function
      const result = await scheduleReferralReminderTouchpoint('referral-id');
      
      // Assertions
      expect(result).toBe(true);
      expect(prisma.referralFeedback.update).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });
  });
});
