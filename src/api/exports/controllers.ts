import { Request, Response } from 'express';
import { prisma } from '../../app';
import { ExportRequestInput } from './validation';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';
import { generateDocumentToken, verifyDocumentToken } from '../../utils/auth';

const exportsDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

export const generateExport = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { exportType } = req.body as ExportRequestInput;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        address: true,
        injuries: true,
        uploads: true,
        liens: true
      }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const timestamp = Date.now();
    const fileName = `${lead.lastName}_${lead.firstName}_${timestamp}.zip`;
    const filePath = path.join(exportsDir, fileName);
    
    const archive = archiver('zip');
    const output = fs.createWriteStream(filePath);
    
    archive.pipe(output);
    
    for (const upload of lead.uploads) {
      const documentPath = path.join(process.cwd(), 'uploads', upload.fileUrl.replace('/uploads/', ''));
      if (fs.existsSync(documentPath)) {
        const documentType = upload.documentType || 'Document';
        const customFileName = `${lead.lastName}_${lead.firstName}_${documentType}_${new Date().toISOString().split('T')[0]}.pdf`;
        archive.append(fs.createReadStream(documentPath), { name: customFileName });
      }
    }
    
    if (exportType === 'NEOS' || exportType === 'Full') {
      const csvPath = path.join(exportsDir, `${lead.lastName}_${lead.firstName}_${timestamp}.csv`);
      
      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: [
          { id: 'lastName', title: 'Last Name' },
          { id: 'firstName', title: 'First Name' },
          { id: 'phoneNumber', title: 'Phone' },
          { id: 'email', title: 'Email' },
          { id: 'address', title: 'Address' },
          { id: 'city', title: 'City' },
          { id: 'state', title: 'State' },
          { id: 'zip', title: 'Zip' },
          { id: 'dateOfAccident', title: 'Date of Accident' },
          { id: 'typeOfAccident', title: 'Type of Accident' },
          { id: 'injuries', title: 'Injuries' },
          { id: 'insurance', title: 'Insurance' },
          { id: 'status', title: 'Status' },
          { id: 'hasUmUimCoverage', title: 'UM/UIM Coverage' },
          { id: 'hasResidentRelatives', title: 'Resident Relatives' }
        ]
      });
      
      await csvWriter.writeRecords([{
        lastName: lead.lastName,
        firstName: lead.firstName,
        phoneNumber: lead.phoneNumber,
        email: lead.email || 'N/A',
        address: lead.address ? lead.address.street : 'N/A',
        city: lead.address ? lead.address.city : 'N/A',
        state: lead.address ? lead.address.state : 'N/A',
        zip: lead.address ? lead.address.zip : 'N/A',
        dateOfAccident: new Date(lead.dateOfAccident).toLocaleDateString(),
        typeOfAccident: lead.typeOfAccident,
        injuries: lead.injuries.map(i => i.bodyPart).join(', '),
        insurance: lead.insurance || 'N/A',
        status: lead.status,
        hasUmUimCoverage: lead.hasUmUimCoverage ? 'Yes' : 'No',
        hasResidentRelatives: lead.hasResidentRelatives ? 'Yes' : 'No'
      }]);
      
      archive.append(fs.createReadStream(csvPath), { name: `${lead.lastName}_${lead.firstName}_NEOS_DATA.csv` });
    }
    
    await archive.finalize();
    
    const exportRecord = await prisma.upload.create({
      data: {
        fileName,
        fileType: 'application/zip',
        fileUrl: `/exports/${fileName}`,
        documentType: 'Export',
        lead: { connect: { id: leadId } }
      }
    });
    
    const token = generateDocumentToken(exportRecord.id);
    
    return res.status(200).json({
      success: true,
      data: {
        export: exportRecord,
        downloadUrl: `/api/exports/${exportRecord.id}?token=${token}`
      }
    });
  } catch (error) {
    console.error('Error generating export:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate export'
    });
  }
};

export const downloadExport = async (req: Request, res: Response) => {
  try {
    const { exportId } = req.params;
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }
    
    try {
      const { documentId } = verifyDocumentToken(token as string);
      if (documentId !== exportId) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    const exportRecord = await prisma.upload.findUnique({
      where: { id: exportId }
    });
    
    if (!exportRecord) {
      return res.status(404).json({
        success: false,
        error: 'Export not found'
      });
    }
    
    const filePath = path.join(exportsDir, exportRecord.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Export file not found'
      });
    }
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${exportRecord.fileName}`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading export:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to download export'
    });
  }
};
