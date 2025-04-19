import { Request, Response } from 'express';
import { prisma } from '../../app';

/**
 * Create a new referral partner
 */
export const createReferralPartner = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, specialty, zip, languages, feeSplitRatio } = req.body;
    
    const existingPartner = await prisma.referralPartner.findUnique({
      where: { email }
    });
    
    if (existingPartner) {
      return res.status(400).json({
        success: false,
        error: 'A referral partner with this email already exists'
      });
    }
    
    const partner = await prisma.referralPartner.create({
      data: {
        name,
        email,
        phone,
        specialty,
        zip,
        languages,
        feeSplitRatio,
        responsiveness: 100, // Default to 100 for new partners
        active: true
      }
    });
    
    return res.status(201).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error creating referral partner:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create referral partner'
    });
  }
};

/**
 * Get all active referral partners
 */
export const getReferralPartners = async (req: Request, res: Response) => {
  try {
    const partners = await prisma.referralPartner.findMany({
      where: {
        active: true
      }
    });
    
    return res.status(200).json({
      success: true,
      data: partners
    });
  } catch (error) {
    console.error('Error getting referral partners:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral partners'
    });
  }
};

/**
 * Get a specific referral partner by ID
 */
export const getReferralPartnerById = async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    
    const partner = await prisma.referralPartner.findUnique({
      where: { id: partnerId }
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Referral partner not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: partner
    });
  } catch (error) {
    console.error('Error getting referral partner:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve referral partner'
    });
  }
};

/**
 * Update a referral partner
 */
export const updateReferralPartner = async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { name, phone, specialty, zip, languages, feeSplitRatio, active, responsiveness } = req.body;
    
    const partner = await prisma.referralPartner.findUnique({
      where: { id: partnerId }
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Referral partner not found'
      });
    }
    
    const updatedPartner = await prisma.referralPartner.update({
      where: { id: partnerId },
      data: {
        name,
        phone,
        specialty,
        zip,
        languages,
        feeSplitRatio,
        active,
        responsiveness,
        updatedAt: new Date()
      }
    });
    
    return res.status(200).json({
      success: true,
      data: updatedPartner
    });
  } catch (error) {
    console.error('Error updating referral partner:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update referral partner'
    });
  }
};
