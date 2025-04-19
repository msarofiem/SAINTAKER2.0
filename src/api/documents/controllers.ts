import { Request, Response } from 'express';
import { prisma } from '../../app';
import { DocumentGenerationInput } from './validation';
import { generatePdf } from '../../utils/pdf';
import { generateDocumentToken } from '../../utils/auth';
import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const generateDocument = async (req: Request, res: Response) => {
  try {
    const { leadId, documentType, additionalData } = req.body as DocumentGenerationInput;
    
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
    
    const documentContent = getDocumentTemplate(documentType, lead, additionalData);
    
    const timestamp = Date.now();
    const fileName = `${documentType.toLowerCase()}_${lead.lastName}_${timestamp}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    
    await generatePdf(documentContent, filePath);
    
    const document = await prisma.upload.create({
      data: {
        fileName,
        fileType: 'application/pdf',
        fileUrl: `/uploads/${fileName}`,
        lead: { connect: { id: leadId } }
      }
    });
    
    const token = generateDocumentToken(document.id);
    
    console.log(`Document generated: ${documentType} for lead ${leadId}`);
    
    return res.status(200).json({
      success: true,
      data: {
        document,
        downloadUrl: `/api/documents/${document.id}?token=${token}`
      }
    });
  } catch (error) {
    console.error('Error generating document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate document'
    });
  }
};

export const getDocument = async (req: Request, res: Response) => {
  try {
    const { documentId } = req.params;
    
    const document = await prisma.upload.findUnique({
      where: { id: documentId }
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    
    const filePath = path.join(process.cwd(), 'uploads', document.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Document file not found'
      });
    }
    
    console.log(`Document accessed: ${document.id} (${document.fileName})`);
    
    return res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Error retrieving document:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve document'
    });
  }
};

function getDocumentTemplate(documentType: string, lead: any, additionalData?: any): string {
  switch (documentType) {
    case 'Retainer':
      return `
        <h1>Retainer Agreement</h1>
        <p>This Retainer Agreement ("Agreement") is made and entered into on ${new Date().toLocaleDateString()} by and between:</p>
        <p><strong>Client:</strong> ${lead.firstName} ${lead.lastName}</p>
        <p><strong>Address:</strong> ${lead.address ? `${lead.address.street}, ${lead.address.city}, ${lead.address.state} ${lead.address.zip}` : 'Not provided'}</p>
        <p><strong>Phone:</strong> ${lead.phoneNumber}</p>
        <p><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
        <p>AND</p>
        <p><strong>Law Firm:</strong> Sarofiem & Antoun, LLC</p>
        <h2>1. Scope of Representation</h2>
        <p>The Client hereby retains the Law Firm to represent the Client in connection with claims for damages arising out of a ${lead.typeOfAccident} that occurred on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
        <h2>2. Attorney's Fees</h2>
        <p>The Client agrees to pay the Law Firm a contingency fee of 33.33% of any recovery obtained before the filing of a lawsuit, and 40% of any recovery obtained after the filing of a lawsuit.</p>
        <h2>3. Costs and Expenses</h2>
        <p>In addition to attorney's fees, the Client shall reimburse the Law Firm for all costs and expenses incurred in connection with the representation, including but not limited to court filing fees, deposition costs, expert witness fees, and investigation expenses.</p>
        <h2>4. Client's Obligations</h2>
        <p>The Client agrees to cooperate fully with the Law Firm, to keep the Law Firm informed of any information relevant to the case, to appear at all required proceedings, and to comply with all reasonable requests of the Law Firm in connection with the preparation and presentation of the case.</p>
        <h2>5. Termination</h2>
        <p>The Client may terminate this Agreement at any time, but shall remain liable for all costs and expenses incurred prior to the termination. The Law Firm may withdraw from representation for good cause, including but not limited to the Client's failure to cooperate or follow the Law Firm's advice.</p>
        <div style="margin-top: 50px;">
          <p>Client Signature: ______________________________ Date: __________</p>
          <p>Attorney Signature: ____________________________ Date: __________</p>
        </div>
      `;
    case 'HIPAA':
      return `
        <h1>HIPAA Authorization for Release of Medical Information</h1>
        <p><strong>Patient Name:</strong> ${lead.firstName} ${lead.lastName}</p>
        <p><strong>Date of Birth:</strong> ${additionalData?.dateOfBirth || '[Date of Birth]'}</p>
        <p><strong>Address:</strong> ${lead.address ? `${lead.address.street}, ${lead.address.city}, ${lead.address.state} ${lead.address.zip}` : 'Not provided'}</p>
        <p><strong>Phone:</strong> ${lead.phoneNumber}</p>
        <h2>Authorization</h2>
        <p>I hereby authorize any physician, hospital, or other healthcare provider to release to Sarofiem & Antoun, LLC and its authorized representatives all medical records, billing information, and other healthcare information related to my care and treatment for injuries sustained in the ${lead.typeOfAccident} that occurred on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
        <h2>Information to be Released</h2>
        <p>This authorization includes, but is not limited to, hospital records, medical records, physician notes, diagnostic test results, radiology reports, laboratory reports, billing records, and any other information related to my care and treatment for the aforementioned injuries.</p>
        <h2>Purpose of Release</h2>
        <p>The purpose of this release is to enable Sarofiem & Antoun, LLC to evaluate, investigate, and pursue my personal injury claim.</p>
        <h2>Expiration</h2>
        <p>This authorization shall remain in effect until the conclusion of my personal injury claim, including any appeals, unless revoked by me in writing at an earlier date.</p>
        <h2>Rights</h2>
        <p>I understand that I have the right to revoke this authorization at any time by providing written notice to Sarofiem & Antoun, LLC. I understand that any revocation will not apply to information that has already been released in response to this authorization.</p>
        <p>I understand that information disclosed pursuant to this authorization may be subject to redisclosure by the recipient and may no longer be protected by federal or state privacy laws.</p>
        <p>I understand that I have the right to inspect or copy the information to be disclosed.</p>
        <p>I understand that I may refuse to sign this authorization and that my refusal will not affect my ability to obtain treatment, payment, or eligibility for benefits.</p>
        <div style="margin-top: 50px;">
          <p>Patient Signature: ______________________________ Date: __________</p>
        </div>
      `;
    case 'Medicare':
      return `
        <h1>Medicare Reporting Compliance Form</h1>
        <p><strong>Client Name:</strong> ${lead.firstName} ${lead.lastName}</p>
        <p><strong>Address:</strong> ${lead.address ? `${lead.address.street}, ${lead.address.city}, ${lead.address.state} ${lead.address.zip}` : 'Not provided'}</p>
        <p><strong>Phone:</strong> ${lead.phoneNumber}</p>
        <p><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
        <h2>Medicare Status</h2>
        <p>Please check all that apply:</p>
        <p>[ ] I am currently enrolled in Medicare</p>
        <p>[ ] I have been enrolled in Medicare in the past</p>
        <p>[ ] I have applied for Medicare</p>
        <p>[ ] I have applied for Social Security Disability</p>
        <p>[ ] I am eligible for Medicare based on age (65 or older)</p>
        <p>[ ] I am eligible for Medicare based on disability</p>
        <p>[ ] I have End-Stage Renal Disease (ESRD)</p>
        <p>[ ] None of the above apply to me</p>
        <h2>Medicare Information</h2>
        <p><strong>Medicare Number:</strong> ______________________________</p>
        <p><strong>Enrollment Date:</strong> ______________________________</p>
        <h2>Acknowledgment</h2>
        <p>I understand that federal law requires that Medicare's interests be considered in any personal injury settlement. I agree to provide accurate information regarding my Medicare status and to update Sarofiem & Antoun, LLC if my Medicare status changes during the course of my case.</p>
        <p>I understand that if I am a Medicare beneficiary, Medicare may have a right to reimbursement from my settlement for medical expenses it has paid related to my injury.</p>
        <p>I understand that failure to properly address Medicare's interests could result in Medicare refusing to pay for future medical care related to my injury and/or seeking reimbursement directly from me.</p>
        <div style="margin-top: 50px;">
          <p>Client Signature: ______________________________ Date: __________</p>
        </div>
      `;
    case 'Rejection':
      return `
        <h1>Non-Engagement Letter</h1>
        <p>Dear ${lead.firstName} ${lead.lastName},</p>
        <p>Thank you for contacting Sarofiem & Antoun, LLC regarding your potential personal injury claim arising from your ${lead.typeOfAccident} on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
        <p>After careful consideration, we regret to inform you that we are unable to represent you in this matter. This decision does not reflect on the merits of your case, and we encourage you to seek a second opinion from another attorney.</p>
        <p>Reason for non-engagement: ${additionalData?.reason || 'Our firm is unable to take your case at this time.'}</p>
        ${additionalData?.notes ? `<p>${additionalData.notes}</p>` : ''}
        <p>Please be advised that there are strict time limitations for filing personal injury claims. We strongly recommend that you consult with another attorney as soon as possible.</p>
        <p>We appreciate your interest in our firm and wish you the best of luck.</p>
        <div style="margin-top: 30px;">
          <p>Sincerely,</p>
          <p>Sarofiem & Antoun, LLC</p>
        </div>
      `;
    default:
      return `
        <h1>Document</h1>
        <p>This document was generated for ${lead.firstName} ${lead.lastName} regarding the ${lead.typeOfAccident} that occurred on ${new Date(lead.dateOfAccident).toLocaleDateString()}.</p>
      `;
  }
}
