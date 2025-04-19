import { Request, Response } from 'express';
import { prisma } from '../../app';
import { SignatureRequestInput, SignatureUpdateInput } from './validation';
import { generateDocumentToken } from '../../utils/auth';
import { sendEmail } from '../../utils/email';

export const createSignatureRequest = async (req: Request, res: Response) => {
  try {
    const { documentId, recipientEmail } = req.body as SignatureRequestInput;
    
    const document = await prisma.upload.findUnique({
      where: { id: documentId },
      include: { lead: true }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    const signatureToken = generateDocumentToken(document.id);
    
    const signature = await prisma.documentSignature.create({
      data: {
        status: 'pending',
        signatureToken,
        document: { connect: { id: documentId } }
      }
    });
    
    const signatureUrl = `${process.env.APP_URL}/sign/${signature.id}?token=${signatureToken}`;
    
    await sendEmail({
      to: recipientEmail,
      subject: 'Document Signature Request',
      html: `
        <p>Dear ${document.lead.firstName} ${document.lead.lastName},</p>
        <p>Please sign the attached document by clicking the link below:</p>
        <p><a href="${signatureUrl}">Sign Document</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>Thank you,</p>
        <p>Sarofiem & Antoun, LLC</p>
      `
    });
    
    return res.status(200).json({
      success: true,
      data: {
        signature,
        signatureUrl
      }
    });
  } catch (error) {
    console.error('Error creating signature request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create signature request'
    });
  }
};

export const updateSignatureStatus = async (req: Request, res: Response) => {
  try {
    const { signatureId } = req.params;
    const { status, signerName } = req.body as SignatureUpdateInput;
    
    const signature = await prisma.documentSignature.findUnique({
      where: { id: signatureId }
    });
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'Signature not found'
      });
    }
    
    const updatedSignature = await prisma.documentSignature.update({
      where: { id: signatureId },
      data: {
        status,
        signedAt: status === 'signed' ? new Date() : undefined,
        ipAddress: status === 'signed' ? req.ip : undefined,
        signerName: signerName
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        signature: updatedSignature
      }
    });
  } catch (error) {
    console.error('Error updating signature status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update signature status'
    });
  }
};

export const getSignatureStatus = async (req: Request, res: Response) => {
  try {
    const { signatureId } = req.params;
    
    const signature = await prisma.documentSignature.findUnique({
      where: { id: signatureId },
      include: {
        document: {
          include: {
            lead: true
          }
        }
      }
    });
    
    if (!signature) {
      return res.status(404).json({
        success: false,
        error: 'Signature not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        signature
      }
    });
  } catch (error) {
    console.error('Error retrieving signature status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve signature status'
    });
  }
};
