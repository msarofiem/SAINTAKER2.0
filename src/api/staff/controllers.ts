import { Request, Response } from 'express';
import { prisma } from '../../app';
import { assignLeadToStaff } from '../../utils/staffAssignment';

let autoAssignEnabled = true;

export const createStaffMember = async (req: Request, res: Response) => {
  try {
    const { name, email, languages } = req.body;
    
    const staffMember = await prisma.staffMember.create({
      data: {
        name,
        email,
        languages: languages || ['English'],
        isActive: true
      }
    });
    
    return res.status(201).json({
      success: true,
      data: staffMember
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create staff member'
    });
  }
};

export const getStaffMembers = async (req: Request, res: Response) => {
  try {
    const staffMembers = await prisma.staffMember.findMany({
      include: {
        assignments: {
          where: {
            isActive: true
          },
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                language: true,
                status: true
              }
            }
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: staffMembers
    });
  } catch (error) {
    console.error('Error getting staff members:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff members'
    });
  }
};

export const assignLead = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    const { staffId, manual } = req.body;
    
    if (manual && staffId) {
      const existingAssignment = await prisma.staffAssignment.findUnique({
        where: { leadId }
      });
      
      if (existingAssignment) {
        const assignment = await prisma.staffAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            staffId,
            isActive: true,
            assignedAt: new Date()
          },
          include: {
            staff: true,
            lead: true
          }
        });
        
        return res.status(200).json({
          success: true,
          data: assignment
        });
      } else {
        const lead = await prisma.lead.findUnique({
          where: { id: leadId }
        });
        
        if (!lead) {
          return res.status(404).json({
            success: false,
            error: 'Lead not found'
          });
        }
        
        const assignment = await prisma.staffAssignment.create({
          data: {
            leadId,
            staffId,
            language: lead.language,
            isActive: true
          },
          include: {
            staff: true,
            lead: true
          }
        });
        
        return res.status(201).json({
          success: true,
          data: assignment
        });
      }
    } else {
      const assignment = await assignLeadToStaff(leadId, autoAssignEnabled);
      
      if (!assignment) {
        return res.status(500).json({
          success: false,
          error: 'Failed to auto-assign lead'
        });
      }
      
      return res.status(201).json({
        success: true,
        data: assignment
      });
    }
  } catch (error) {
    console.error('Error assigning lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to assign lead'
    });
  }
};

export const getStaffAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        isActive: true
      },
      include: {
        staff: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            language: true,
            status: true,
            createdAt: true
          }
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        assignments,
        autoAssignEnabled
      }
    });
  } catch (error) {
    console.error('Error getting staff assignments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve staff assignments'
    });
  }
};

export const toggleAutoAssign = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Enabled must be a boolean value'
      });
    }
    
    autoAssignEnabled = enabled;
    
    return res.status(200).json({
      success: true,
      data: {
        autoAssignEnabled
      }
    });
  } catch (error) {
    console.error('Error toggling auto-assign:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to toggle auto-assign'
    });
  }
};
