import { Request, Response } from 'express';
import { prisma } from '../../app';
import { sendEmail } from '../../utils/email';
import { generateToken, verifyToken } from '../../utils/auth';

export const createCarrierAccess = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { carrierName, carrierEmail } = req.body;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const accessToken = generateToken({ leadId, carrierEmail });
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const existingAccess = await prisma.carrierAccess.findFirst({
      where: {
        leadId,
        carrierEmail
      }
    });
    
    let carrierAccess;
    
    if (existingAccess) {
      carrierAccess = await prisma.carrierAccess.update({
        where: { id: existingAccess.id },
        data: {
          accessToken,
          expiresAt,
          carrierName
        }
      });
    } else {
      carrierAccess = await prisma.carrierAccess.create({
        data: {
          leadId,
          carrierName,
          carrierEmail,
          accessToken,
          expiresAt
        }
      });
    }
    
    const accessUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/carrier/view?token=${accessToken}`;
    
    const emailSent = await sendEmail({
      to: carrierEmail,
      subject: `Secure Access to Case Documents - ${lead.firstName} ${lead.lastName}`,
      text: `
Dear ${carrierName} Representative,

You have been granted secure access to view case documents for ${lead.firstName} ${lead.lastName}.

Please use the following link to access the documents:
${accessUrl}

This link will expire in 7 days.

Thank you,
Sarofiem & Antoun, LLC
      `,
      leadId
    });
    
    return res.status(200).json({
      success: true,
      data: {
        carrierAccess,
        accessUrl,
        emailSent
      }
    });
  } catch (error) {
    console.error('Error creating carrier access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create carrier access'
    });
  }
};

export const getCarrierAccess = async (req: Request, res: Response) => {
  try {
    const carrierAccess = await prisma.carrierAccess.findMany({
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: carrierAccess
    });
  } catch (error) {
    console.error('Error getting carrier access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve carrier access'
    });
  }
};

export const verifyCarrierAccess = async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.leadId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    const carrierAccess = await prisma.carrierAccess.findFirst({
      where: {
        accessToken: token,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });
    
    if (!carrierAccess) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    await prisma.carrierAccess.update({
      where: { id: carrierAccess.id },
      data: {
        lastAccessedAt: new Date()
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        carrierAccess,
        lead: carrierAccess.lead
      }
    });
  } catch (error) {
    console.error('Error verifying carrier access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify carrier access'
    });
  }
};

export const getCarrierDocuments = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.leadId !== leadId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    const carrierAccess = await prisma.carrierAccess.findFirst({
      where: {
        leadId,
        accessToken: token,
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    if (!carrierAccess) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        injuries: true,
        uploads: {
          where: {
            documentType: {
              in: ['ID', 'Police Report', 'Insurance', 'Medical']
            }
          }
        }
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    console.log(`Carrier ${carrierAccess.carrierName} accessed documents for lead ${leadId} at ${new Date().toISOString()}`);
    
    return res.status(200).json({
      success: true,
      data: {
        lead: {
          id: lead.id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          dateOfAccident: lead.dateOfAccident,
          typeOfAccident: lead.typeOfAccident,
          injuries: lead.injuries
        },
        documents: lead.uploads
      }
    });
  } catch (error) {
    console.error('Error getting carrier documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve carrier documents'
    });
  }
};
