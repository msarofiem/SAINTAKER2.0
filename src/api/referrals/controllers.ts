import { Request, Response } from 'express';
import { prisma } from '../../app';
import { ReferralInput, RejectionInput } from './validation';
import { generatePdf } from '../../utils/pdf';
import { sendEmail } from '../../utils/email';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const createReferral = async (req: Request, res: Response) => {
  try {
    const { leadId, attorneyName, attorneyEmail, attorneyPhone, notes } = req.body as ReferralInput;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        address: true,
        injuries: true,
        priorAttorney: true
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'Referred'
      }
    });
    
    const emailContent = `
      <h1>Case Referral: ${lead.firstName} ${lead.lastName}</h1>
      <p>Dear ${attorneyName},</p>
      <p>We are referring the following personal injury case to your office:</p>
      <h2>Client Information</h2>
      <ul>
        <li>Name: ${lead.firstName} ${lead.lastName}</li>
        <li>Phone: ${lead.phoneNumber}</li>
        <li>Email: ${lead.email || 'Not provided'}</li>
        <li>Address: ${lead.address ? `${lead.address.street}, ${lead.address.city}, ${lead.address.state} ${lead.address.zip}` : 'Not provided'}</li>
      </ul>
      <h2>Case Information</h2>
      <ul>
        <li>Type of Accident: ${lead.typeOfAccident}</li>
        <li>Date of Accident: ${new Date(lead.dateOfAccident).toLocaleDateString()}</li>
        <li>Police Involved: ${lead.policeInvolved ? 'Yes' : 'No'}</li>
        <li>Insurance: ${lead.insurance || 'Not provided'}</li>
      </ul>
      <h2>Injuries</h2>
      <ul>
        ${lead.injuries.map((injury: { bodyPart: string; description?: string }) => `<li>${injury.bodyPart}${injury.description ? `: ${injury.description}` : ''}</li>`).join('')}
      </ul>
      ${notes ? `<h2>Additional Notes</h2><p>${notes}</p>` : ''}
      <p>Please contact the client directly to proceed with representation.</p>
      <p>Thank you,</p>
      <p>Sarofiem & Antoun, LLC</p>
    `;
    
    await sendEmail({
      to: attorneyEmail,
      subject: `Case Referral: ${lead.firstName} ${lead.lastName}`,
      html: emailContent
    });
    
    console.log(`Lead ${leadId} referred to ${attorneyName} (${attorneyEmail})`);
    
    return res.status(200).json({
      success: true,
      message: 'Lead referred successfully'
    });
  } catch (error) {
    console.error('Error creating referral:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create referral'
    });
  }
};

export const rejectLead = async (req: Request, res: Response) => {
  try {
    const { leadId, reason, sendEmail: shouldSendEmail, notes } = req.body as RejectionInput;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        address: true
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'Rejected'
      }
    });
    
    const rejectionContent = `
      <h1>Non-Engagement Letter</h1>
      <p>Dear ${lead.firstName} ${lead.lastName},</p>
      <p>Thank you for contacting Sarofiem & Antoun, LLC regarding your potential personal injury claim arising from your ${lead.typeOfAccident} on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
      <p>After careful consideration, we regret to inform you that we are unable to represent you in this matter. This decision does not reflect on the merits of your case, and we encourage you to seek a second opinion from another attorney.</p>
      <p>Reason for non-engagement: ${reason}</p>
      ${notes ? `<p>${notes}</p>` : ''}
      <p>Please be advised that there are strict time limitations for filing personal injury claims. We strongly recommend that you consult with another attorney as soon as possible.</p>
      <p>We appreciate your interest in our firm and wish you the best of luck.</p>
      <div style="margin-top: 30px;">
        <p>Sincerely,</p>
        <p>Sarofiem & Antoun, LLC</p>
      </div>
    `;
    
    const timestamp = Date.now();
    const fileName = `rejection_${lead.lastName}_${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    await generatePdf(rejectionContent, filePath);
    
    const document = await prisma.upload.create({
      data: {
        fileName,
        fileType: 'application/pdf',
        fileUrl: `/uploads/${fileName}`,
        lead: { connect: { id: leadId } }
      }
    });
    
    if (shouldSendEmail && lead.email) {
      await sendEmail({
        to: lead.email,
        subject: 'Regarding Your Legal Matter',
        html: `
          <p>Dear ${lead.firstName} ${lead.lastName},</p>
          <p>Please find attached our letter regarding your legal matter.</p>
          <p>Sincerely,</p>
          <p>Sarofiem & Antoun, LLC</p>
        `,
        attachments: [
          {
            filename: fileName,
            path: filePath
          }
        ]
      });
    }
    
    console.log(`Lead ${leadId} rejected. Reason: ${reason}`);
    
    return res.status(200).json({
      success: true,
      message: 'Lead rejected successfully',
      data: {
        document
      }
    });
  } catch (error) {
    console.error('Error rejecting lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject lead'
    });
  }
};
