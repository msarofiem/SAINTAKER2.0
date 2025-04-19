import { Request, Response } from 'express';
import { prisma } from '../../app';
import { createPortalAccess, verifyPortalToken } from '../../utils/portalAuth';
import { sendEmail } from '../../utils/email';
import path from 'path';
import fs from 'fs';
import { PortalAccessInput } from './validation';

export const verifyPortalAccess = async (req: Request, res: Response) => {
  try {
    const { leadId, pin } = req.body as PortalAccessInput;
    
    const portalAccess = await prisma.clientPortalAccess.findUnique({
      where: { leadId },
      include: { lead: true }
    });
    
    if (!portalAccess) {
      return res.status(404).json({
        success: false,
        error: 'Portal access not found'
      });
    }
    
    if (portalAccess.pin !== pin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }
    
    if (portalAccess.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Access expired'
      });
    }
    
    await prisma.clientPortalAccess.update({
      where: { id: portalAccess.id },
      data: {
        accessedAt: new Date(),
        ipAddress: req.ip
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        token: portalAccess.token,
        lead: {
          id: portalAccess.lead.id,
          firstName: portalAccess.lead.firstName,
          lastName: portalAccess.lead.lastName,
          status: portalAccess.lead.status
        }
      }
    });
  } catch (error) {
    console.error('Error verifying portal access:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify portal access'
    });
  }
};

export const getLeadStatus = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        uploads: {
          include: {
            signatures: true
          }
        },
        chaseLogs: {
          orderBy: {
            createdAt: 'desc'
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
    
    return res.status(200).json({
      success: true,
      data: {
        lead,
        timeline: lead.chaseLogs.map(log => ({
          id: log.id,
          type: log.type,
          status: log.status,
          date: log.createdAt,
          notes: log.notes
        }))
      }
    });
  } catch (error) {
    console.error('Error retrieving lead status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve lead status'
    });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { documentType, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const uploadsDir = path.join(process.cwd(), 'uploads', leadId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const fileExtension = path.extname(file.originalname);
    const timestamp = Date.now();
    const newFileName = `${documentType}_${timestamp}${fileExtension}`;
    const newFilePath = path.join(uploadsDir, newFileName);
    
    fs.renameSync(file.path, newFilePath);
    
    const upload = await prisma.upload.create({
      data: {
        fileName: newFileName,
        fileType: file.mimetype,
        fileUrl: `/uploads/${leadId}/${newFileName}`,
        documentType,
        lead: { connect: { id: leadId } }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        upload
      }
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload document'
    });
  }
};
