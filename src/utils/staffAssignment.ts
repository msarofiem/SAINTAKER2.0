import { prisma } from '../app';

export const assignLeadToStaff = async (leadId: string, autoAssign: boolean = true) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      console.error(`Lead ${leadId} not found for staff assignment`);
      return null;
    }
    
    if (!autoAssign) {
      console.log(`Auto-assign disabled for lead ${leadId}`);
      return null;
    }
    
    const activeStaff = await prisma.staffMember.findMany({
      where: {
        isActive: true
      },
      include: {
        assignments: {
          where: {
            isActive: true
          }
        }
      }
    });
    
    if (activeStaff.length === 0) {
      console.error('No active staff members found for assignment');
      return null;
    }
    
    let eligibleStaff = activeStaff;
    
    if (lead.language && lead.language !== 'English') {
      const languageMatchStaff = activeStaff.filter(staff => 
        staff.languages.includes(lead.language)
      );
      
      if (languageMatchStaff.length > 0) {
        eligibleStaff = languageMatchStaff;
      }
    }
    
    eligibleStaff.sort((a, b) => 
      a.assignments.length - b.assignments.length
    );
    
    const selectedStaff = eligibleStaff[0];
    
    const assignment = await prisma.staffAssignment.create({
      data: {
        leadId,
        staffId: selectedStaff.id,
        language: lead.language,
        isActive: true
      },
      include: {
        staff: true
      }
    });
    
    console.log(`Lead ${leadId} assigned to staff ${selectedStaff.id}`);
    return assignment;
  } catch (error) {
    console.error('Error assigning lead to staff:', error);
    return null;
  }
};

export const getStaffAssignmentSettings = async () => {
  return {
    autoAssignEnabled: true
  };
};

export const reassignLead = async (leadId: string, newStaffId: string) => {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    });
    
    if (!lead) {
      console.error(`Lead ${leadId} not found for reassignment`);
      return null;
    }
    
    const staff = await prisma.staffMember.findUnique({
      where: {
        id: newStaffId,
        isActive: true
      }
    });
    
    if (!staff) {
      console.error(`Staff ${newStaffId} not found or not active for reassignment`);
      return null;
    }
    
    const existingAssignment = await prisma.staffAssignment.findUnique({
      where: { leadId }
    });
    
    let assignment;
    
    if (existingAssignment) {
      await prisma.staffAssignment.update({
        where: { id: existingAssignment.id },
        data: { isActive: false }
      });
      
      assignment = await prisma.staffAssignment.create({
        data: {
          leadId,
          staffId: newStaffId,
          language: lead.language,
          isActive: true
        },
        include: {
          staff: true
        }
      });
    } else {
      assignment = await prisma.staffAssignment.create({
        data: {
          leadId,
          staffId: newStaffId,
          language: lead.language,
          isActive: true
        },
        include: {
          staff: true
        }
      });
    }
    
    console.log(`Lead ${leadId} reassigned to staff ${newStaffId}`);
    return assignment;
  } catch (error) {
    console.error('Error reassigning lead:', error);
    return null;
  }
};

export const getStaffWorkload = async () => {
  try {
    const staffWithAssignments = await prisma.staffMember.findMany({
      where: {
        isActive: true
      },
      include: {
        assignments: {
          where: {
            isActive: true
          },
          include: {
            lead: true
          }
        }
      }
    });
    
    const workloadStats = staffWithAssignments.map(staff => ({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      languages: staff.languages,
      activeAssignments: staff.assignments.length,
      leads: staff.assignments.map(assignment => ({
        id: assignment.lead.id,
        name: `${assignment.lead.firstName} ${assignment.lead.lastName}`,
        language: assignment.lead.language,
        status: assignment.lead.status,
        assignedAt: assignment.assignedAt
      }))
    }));
    
    return workloadStats;
  } catch (error) {
    console.error('Error getting staff workload:', error);
    return [];
  }
};
