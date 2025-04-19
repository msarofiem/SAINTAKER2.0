import cron from 'node-cron';
import { prisma } from '../app';
import { sendSMS } from '../utils/twilio';
import { sendEmail } from '../utils/email';
import { createTouchpointMessage } from '../utils/twilio';
import { checkReferralReminders } from '../api/referrals/feedback';

export const startTouchpointScheduler = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running touchpoint delivery at', new Date().toISOString());
      
      const pendingTouchpoints = await prisma.clientTouchpoint.findMany({
        where: {
          status: 'Pending',
          scheduledFor: {
            lte: new Date()
          }
        },
        include: {
          lead: true
        }
      });
      
      console.log(`Found ${pendingTouchpoints.length} pending touchpoints to deliver`);
      
      for (const touchpoint of pendingTouchpoints) {
        try {
          let delivered = false;
          let deliveryResult;
          
          if (touchpoint.type === 'SMS' && touchpoint.lead.phoneNumber) {
            deliveryResult = await sendSMS(
              touchpoint.lead.phoneNumber,
              touchpoint.messageContent,
              touchpoint.lead.id
            );
            delivered = deliveryResult.success;
          } else if (touchpoint.lead.email) {
            delivered = await sendEmail({
              to: touchpoint.lead.email,
              subject: 'Update on Your Case - Sarofiem & Antoun, LLC',
              text: touchpoint.messageContent,
              leadId: touchpoint.lead.id
            });
          }
          
          await prisma.clientTouchpoint.update({
            where: { id: touchpoint.id },
            data: {
              status: delivered ? 'Sent' : 'Failed',
              sentAt: delivered ? new Date() : undefined,
              deliveryMethod: touchpoint.type === 'SMS' ? 
                (deliveryResult?.fallback === 'email' ? 'Email' : 'Twilio') : 
                'Email'
            }
          });
          
          console.log(`Touchpoint ${touchpoint.id} delivered: ${delivered}`);
        } catch (error) {
          console.error(`Error delivering touchpoint ${touchpoint.id}:`, error);
          
          await prisma.clientTouchpoint.update({
            where: { id: touchpoint.id },
            data: {
              status: 'Failed'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in touchpoint scheduler:', error);
    }
  });
  
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Running referral reminder check at', new Date().toISOString());
      await checkReferralReminders();
    } catch (error) {
      console.error('Error in referral reminder scheduler:', error);
    }
  });
  
  console.log('Touchpoint scheduler started');
};

export const scheduleLeadTouchpoints = async (leadId: string) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      console.error(`Lead ${leadId} not found for touchpoint scheduling`);
      return false;
    }
    
    const now = new Date();
    
    const twentyFourHours = new Date(now);
    twentyFourHours.setHours(twentyFourHours.getHours() + 24);
    
    const seventyTwoHours = new Date(now);
    seventyTwoHours.setHours(seventyTwoHours.getHours() + 72);
    
    await prisma.clientTouchpoint.createMany({
      data: [
        {
          leadId,
          type: lead.phoneNumber ? 'SMS' : 'Email',
          status: 'Pending',
          messageContent: createTouchpointMessage('24h', `${lead.firstName}`, `${lead.typeOfAccident} on ${lead.dateOfAccident.toLocaleDateString()}`),
          scheduledFor: twentyFourHours
        },
        {
          leadId,
          type: lead.phoneNumber ? 'SMS' : 'Email',
          status: 'Pending',
          messageContent: createTouchpointMessage('72h', `${lead.firstName}`, `${lead.typeOfAccident} on ${lead.dateOfAccident.toLocaleDateString()}`),
          scheduledFor: seventyTwoHours
        }
      ]
    });
    
    console.log(`Scheduled touchpoints for lead ${leadId}`);
    return true;
  } catch (error) {
    console.error('Error scheduling touchpoints:', error);
    return false;
  }
};

export const schedulePostSignatureTouchpoint = async (leadId: string) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      console.error(`Lead ${leadId} not found for post-signature touchpoint`);
      return false;
    }
    
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setDate(nextDay.getDate() + 1);
    
    await prisma.clientTouchpoint.create({
      data: {
        leadId,
        type: lead.phoneNumber ? 'SMS' : 'Email',
        status: 'Pending',
        messageContent: createTouchpointMessage('post-signature', `${lead.firstName}`, `${lead.typeOfAccident} on ${lead.dateOfAccident.toLocaleDateString()}`),
        scheduledFor: nextDay
      }
    });
    
    console.log(`Scheduled post-signature touchpoint for lead ${leadId}`);
    return true;
  } catch (error) {
    console.error('Error scheduling post-signature touchpoint:', error);
    return false;
  }
};

export const scheduleReferralReminderTouchpoint = async (referralId: string) => {
  try {
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        feedback: true,
        lead: true
      }
    });
    
    if (!referral || !referral.lead) {
      console.error(`Referral ${referralId} not found for reminder touchpoint`);
      return false;
    }
    
    if (referral.feedback && referral.feedback.status !== 'Pending') {
      console.log(`Referral ${referralId} already has feedback with status: ${referral.feedback.status}`);
      return false;
    }
    
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    if (!referral.feedback) {
      await prisma.referralFeedback.create({
        data: {
          referralId,
          status: 'Pending',
          lastReminderAt: now
        }
      });
    } else {
      await prisma.referralFeedback.update({
        where: { referralId },
        data: {
          lastReminderAt: now
        }
      });
    }
    
    await sendEmail({
      to: referral.email,
      subject: `Reminder: Feedback Requested for Referred Case - ${referral.lead.firstName} ${referral.lead.lastName}`,
      text: `Hello,\n\nThis is a reminder that we are waiting for your feedback on the case of ${referral.lead.firstName} ${referral.lead.lastName} that was referred to you on ${referral.referralDate.toLocaleDateString()}.\n\nPlease let us know if you have accepted the case or if you have any questions.\n\nThank you,\nSarofiem & Antoun, LLC`
    });
    
    console.log(`Scheduled referral reminder for referral ${referralId}`);
    return true;
  } catch (error) {
    console.error('Error scheduling referral reminder:', error);
    return false;
  }
};
