import { Request, Response } from 'express';
import { prisma } from '../../app';
import { sendEmail } from '../../utils/email';
import { scheduleReferralReminderTouchpoint } from '../../scheduler/touchpointScheduler';
import { emitReferralFeedbackNotification } from '../../sockets/notificationSocket';

export const getReferralStatus = async (req: Request, res: Response) => {
  try {
    const referrals = await prisma.referral.findMany({
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        },
        feedback: true
      }
    });
    
    return res.status(200).json({
      success: true,
      data: referrals
    });
  } catch (error) {
    console.error('Error getting referral status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral status'
    });
  }
};

export const updateReferralFeedback = async (req: Request, res: Response) => {
  try {
    const { referralId } = req.params;
    const { status, fee, comments } = req.body;
    
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        feedback: true,
        lead: true
      }
    });
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }
    
    let feedback;
    
    if (referral.feedback) {
      feedback = await prisma.referralFeedback.update({
        where: { id: referral.feedback.id },
        data: {
          status,
          fee,
          comments,
          responseAt: new Date()
        }
      });
    } else {
      feedback = await prisma.referralFeedback.create({
        data: {
          referralId,
          status,
          fee,
          comments,
          responseAt: new Date()
        }
      });
    }
    
    if (status === 'Accepted' || status === 'Declined') {
      await prisma.lead.update({
        where: { id: referral.lead.id },
        data: {
          status: status === 'Accepted' ? 'Referred - Accepted' : 'Referred - Declined'
        }
      });
      
      try {
        await emitReferralFeedbackNotification(referralId);
      } catch (socketError) {
        console.error('Error emitting referral feedback notification:', socketError);
      }
    }
    
    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error updating referral feedback:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update referral feedback'
    });
  }
};

export const sendReferralReminder = async (req: Request, res: Response) => {
  try {
    const { referralId } = req.params;
    
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        lead: true,
        feedback: true
      }
    });
    
    if (!referral) {
      return res.status(404).json({
        success: false,
        error: 'Referral not found'
      });
    }
    
    const emailSent = await sendEmail({
      to: referral.email,
      subject: 'Reminder: Feedback on Referred Case',
      text: `
Dear ${referral.referredTo},

This is a friendly reminder about the case we referred to you for ${referral.lead.firstName} ${referral.lead.lastName}.

We would appreciate your feedback on whether you have accepted this case or if you need any additional information.

Please reply to this email or contact us directly.

Thank you,
Sarofiem & Antoun, LLC
      `,
      leadId: referral.lead.id
    });
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send reminder email'
      });
    }
    
    let feedback;
    
    if (referral.feedback) {
      feedback = await prisma.referralFeedback.update({
        where: { id: referral.feedback.id },
        data: {
          lastReminderAt: new Date()
        }
      });
    } else {
      feedback = await prisma.referralFeedback.create({
        data: {
          referralId,
          status: 'Pending',
          lastReminderAt: new Date()
        }
      });
    }
    
    await scheduleReferralReminderTouchpoint(referralId);
    
    return res.status(200).json({
      success: true,
      data: {
        feedback,
        emailSent: true
      }
    });
  } catch (error) {
    console.error('Error sending referral reminder:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send referral reminder'
    });
  }
};

export const checkReferralReminders = async () => {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const referralsNeedingReminders = await prisma.referral.findMany({
      where: {
        OR: [
          { feedback: null },
          {
            feedback: {
              status: 'Pending',
              lastReminderAt: {
                lt: threeDaysAgo
              }
            }
          }
        ]
      },
      include: {
        lead: true,
        feedback: true
      }
    });
    
    console.log(`Found ${referralsNeedingReminders.length} referrals needing reminders`);
    
    for (const referral of referralsNeedingReminders) {
      try {
        const emailSent = await sendEmail({
          to: referral.email,
          subject: 'Reminder: Feedback on Referred Case',
          text: `
Dear ${referral.referredTo},

This is a friendly reminder about the case we referred to you for ${referral.lead.firstName} ${referral.lead.lastName}.

We would appreciate your feedback on whether you have accepted this case or if you need any additional information.

Please reply to this email or contact us directly.

Thank you,
Sarofiem & Antoun, LLC
          `,
          leadId: referral.lead.id
        });
        
        if (emailSent) {
          if (referral.feedback) {
            await prisma.referralFeedback.update({
              where: { id: referral.feedback.id },
              data: {
                lastReminderAt: new Date()
              }
            });
          } else {
            await prisma.referralFeedback.create({
              data: {
                referralId: referral.id,
                status: 'Pending',
                lastReminderAt: new Date()
              }
            });
          }
          
          console.log(`Sent reminder for referral ${referral.id}`);
          
          await scheduleReferralReminderTouchpoint(referral.id);
        }
      } catch (error) {
        console.error(`Error sending reminder for referral ${referral.id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking referral reminders:', error);
    return false;
  }
};
