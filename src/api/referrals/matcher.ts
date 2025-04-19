import { Request, Response } from 'express';
import { prisma } from '../../app';

/**
 * Calculate match score between lead and partner
 * Scoring criteria:
 * - Language match: 30 points
 * - Zip code match: 40 points
 * - Specialty/accident type match: 30 points
 * - Adjusted by partner responsiveness
 */
const calculateMatchScore = (lead: any, partner: any): number => {
  let score = 0;
  
  if (partner.languages.includes(lead.language)) {
    score += 30;
  }
  
  if (lead.address && partner.zip.includes(lead.address.zip)) {
    score += 40;
  }
  
  if (partner.specialty.includes(lead.typeOfAccident)) {
    score += 30;
  }
  
  return (score * (partner.responsiveness || 100)) / 100;
};

/**
 * Find referral matches for a lead
 */
export const findReferralMatches = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    
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
    
    const partners = await prisma.referralPartner.findMany({
      where: {
        active: true
      }
    });
    
    const matches = partners.map(partner => {
      const matchQuality = calculateMatchScore(lead, partner);
      return {
        partner,
        matchQuality
      };
    });
    
    const sortedMatches = matches.sort((a, b) => b.matchQuality - a.matchQuality);
    
    const topMatches = sortedMatches.slice(0, 5);
    
    return res.status(200).json({
      success: true,
      data: {
        matches: topMatches
      }
    });
  } catch (error) {
    console.error('Error finding referral matches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to find referral matches'
    });
  }
};

/**
 * Create a referral match
 */
export const createReferralMatch = async (req: Request, res: Response) => {
  try {
    const { leadId, partnerId } = req.params;
    const { notes } = req.body;
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead not found'
      });
    }
    
    const partner = await prisma.referralPartner.findUnique({
      where: { id: partnerId }
    });
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Referral partner not found'
      });
    }
    
    const matchQuality = calculateMatchScore(lead, partner);
    
    const referral = await prisma.referral.create({
      data: {
        leadId,
        referredTo: partner.name,
        email: partner.email,
        phoneNumber: partner.phone || '',
        notes: notes || '',
        referralDate: new Date()
      }
    });
    
    const match = await prisma.referralMatch.create({
      data: {
        referralId: referral.id,
        partnerId,
        matchQuality,
        notes: notes || ''
      },
      include: {
        referral: true,
        partner: true
      }
    });
    
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: 'Referred - Pending'
      }
    });
    
    return res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error('Error creating referral match:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create referral match'
    });
  }
};
