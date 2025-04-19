import { Request, Response } from 'express';
import { prisma } from '../../app';
import { sendEmail } from '../../utils/email';
import { emitNewLeadNotification } from '../../sockets/notificationSocket';

export const createReferral = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { referredTo, email, phone, firm, reason, documents } = req.body;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const referral = await prisma.referral.create({
      data: {
        leadId,
        referredTo,
        email,
        phoneNumber: phone,
        notes: reason,
        referralDate: new Date()
      },
      include: {
        lead: true
      }
    });
    
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'Referred - Pending'
      }
    });
    
    const emailSent = await sendEmail({
      to: email,
      subject: `Case Referral: ${lead.firstName} ${lead.lastName}`,
      text: `
Dear ${referredTo},

We are referring the case of ${lead.firstName} ${lead.lastName} to your firm.

Case details:
- Type of accident: ${lead.typeOfAccident}
- Date of accident: ${lead.dateOfAccident.toLocaleDateString()}
- Reason for referral: ${reason}

Please let us know if you will be accepting this case.

Thank you,
Sarofiem & Antoun, LLC
      `,
      leadId
    });
    
    try {
      await emitNewLeadNotification(leadId);
    } catch (socketError) {
      console.error('Error emitting notification:', socketError);
    }
    
    return res.status(201).json({
      success: true,
      data: {
        referral,
        emailSent
      }
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create referral'
    });
  }
};

export const getReferrals = async (req: Request, res: Response) => {
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
    console.error('Error getting referrals:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve referrals'
    });
  }
};
