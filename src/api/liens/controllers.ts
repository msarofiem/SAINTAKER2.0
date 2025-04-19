import { Request, Response } from 'express';
import { prisma } from '../../app';
import { LienCreationInput, LienUpdateInput } from './validation';
import { generatePdf } from '../../utils/pdf';
import { sendEmail } from '../../utils/email';
import { getLongworthTemplate } from '../../utils/templates/longworth';
import path from 'path';
import fs from 'fs';

export const createLien = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { lienType, lienHolder, amount, status, notes } = req.body as LienCreationInput;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const lien = await prisma.lienRecord.create({
      data: {
        lienType,
        lienHolder,
        amount,
        status,
        notes,
        lead: { connect: { id: leadId } }
      }
    });
    
    return res.status(201).json({
      success: true,
      data: {
        lien
      }
    });
  } catch (error) {
    console.error('Error creating lien record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create lien record'
    });
  }
};

export const updateLien = async (req: Request, res: Response) => {
  try {
    const { lienId } = req.params;
    const { lienType, lienHolder, amount, status, notes } = req.body as LienUpdateInput;
    
    const lien = await prisma.lienRecord.findUnique({
      where: { id: lienId }
    });
    
    if (!lien) {
      return res.status(404).json({
        success: false,
        error: 'Lien record not found'
      });
    }
    
    const updatedLien = await prisma.lienRecord.update({
      where: { id: lienId },
      data: {
        lienType,
        lienHolder,
        amount,
        status,
        notes
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        lien: updatedLien
      }
    });
  } catch (error) {
    console.error('Error updating lien record:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update lien record'
    });
  }
};

export const getLiens = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const liens = await prisma.lienRecord.findMany({
      where: { leadId }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        liens
      }
    });
  } catch (error) {
    console.error('Error retrieving lien records:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve lien records'
    });
  }
};

export const generateLongworthLetter = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { insuranceCarrier, policyNumber, tortfeasorLimit } = req.body;
    
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
    
    if (!lead.hasUmUimCoverage) {
      return res.status(400).json({
        success: false,
        error: 'Lead does not have UM/UIM coverage'
      });
    }
    
    const insuranceInfo = {
      carrierName: insuranceCarrier,
      policyNumber,
      tortfeasorLimit
    };
    
    const longworthContent = getLongworthTemplate(lead, insuranceInfo);
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const fileName = `longworth_${lead.lastName}_${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    await generatePdf(longworthContent, filePath);
    
    const document = await prisma.upload.create({
      data: {
        fileName,
        fileType: 'application/pdf',
        fileUrl: `/uploads/${fileName}`,
        documentType: 'Longworth',
        lead: { connect: { id: leadId } }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        document
      }
    });
  } catch (error) {
    console.error('Error generating Longworth letter:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate Longworth letter'
    });
  }
};
