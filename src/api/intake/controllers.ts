import { Request, Response } from 'express';
import { prisma } from '../../app';

export const createShortFormLead = async (req: Request, res: Response) => {
  try {
    const { 
      firstName, lastName, phoneNumber, email, language, source,
      address, typeOfAccident, dateOfAccident, injuryBodyParts,
      policeInvolved, insurance, priorAttorney, uploads 
    } = req.body;

    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        phoneNumber,
        email,
        language: language || 'English',
        source,
        typeOfAccident,
        dateOfAccident: new Date(dateOfAccident),
        policeInvolved: policeInvolved || false,
        insurance,
        status: 'New',
        address: address ? {
          create: {
            street: address.street,
            city: address.city,
            state: address.state,
            zip: address.zip
          }
        } : undefined,
        injuries: {
          create: injuryBodyParts.map((bodyPart: string) => ({
            bodyPart
          }))
        },
        priorAttorney: priorAttorney ? {
          create: {
            spokenTo: priorAttorney.spokenTo || false,
            firmName: priorAttorney.firmName,
            attorneyName: priorAttorney.attorneyName
          }
        } : undefined,
        uploads: {
          create: uploads.map((upload: any) => ({
            fileName: upload.fileName,
            fileType: upload.fileType,
            fileUrl: upload.fileUrl
          }))
        },
        chaseLogs: {
          create: [
            {
              type: 'Call',
              status: 'Pending',
              notes: 'Initial call attempt',
              scheduledFor: new Date()
            },
            {
              type: 'SMS',
              status: 'Pending',
              notes: 'Initial SMS follow-up',
              scheduledFor: new Date()
            },
            {
              type: 'Email',
              status: 'Pending',
              notes: 'Initial email follow-up',
              scheduledFor: new Date()
            }
          ]
        }
      },
      include: {
        address: true,
        injuries: true,
        priorAttorney: true,
        uploads: true,
        chaseLogs: true
      }
    });

    await scheduleFollowUpChaseLogs(lead.id);
    
    try {
      const { scheduleLeadTouchpoints } = require('../../scheduler/touchpointScheduler');
      await scheduleLeadTouchpoints(lead.id);
    } catch (error) {
      console.error('Error scheduling touchpoints:', error);
    }
    
    try {
      const { assignLeadToStaff, getStaffAssignmentSettings } = require('../../utils/staffAssignment');
      const settings = await getStaffAssignmentSettings();
      const assignment = await assignLeadToStaff(lead.id, settings.autoAssignEnabled);
      
      if (assignment) {
        console.log(`Lead ${lead.id} assigned to staff ${assignment.staffId}`);
      }
    } catch (error) {
      console.error('Error assigning lead to staff:', error);
    }

    return res.status(200).json({
      success: true,
      data: lead
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create lead'
    });
  }
};

const scheduleFollowUpChaseLogs = async (leadId: string) => {
  try {
    const fourHoursLater = new Date();
    fourHoursLater.setHours(fourHoursLater.getHours() + 4);

    const twentyFourHoursLater = new Date();
    twentyFourHoursLater.setHours(twentyFourHoursLater.getHours() + 24);

    const seventyTwoHoursLater = new Date();
    seventyTwoHoursLater.setHours(seventyTwoHoursLater.getHours() + 72);

    await prisma.chaseLog.createMany({
      data: [
        {
          leadId,
          type: 'Call',
          status: 'Pending',
          notes: '4-hour reminder call',
          scheduledFor: fourHoursLater
        },
        {
          leadId,
          type: 'Call',
          status: 'Pending',
          notes: '24-hour follow-up call',
          scheduledFor: twentyFourHoursLater
        },
        {
          leadId,
          type: 'Email',
          status: 'Pending',
          notes: '72-hour escalation',
          scheduledFor: seventyTwoHoursLater
        }
      ]
    });

    /*
    const chaseQueue = new Queue('chase-queue');
    
    await chaseQueue.add('4-hour-reminder', { leadId }, { delay: 4 * 60 * 60 * 1000 });
    await chaseQueue.add('24-hour-followup', { leadId }, { delay: 24 * 60 * 60 * 1000 });
    await chaseQueue.add('72-hour-escalation', { leadId }, { delay: 72 * 60 * 60 * 1000 });
    */
  } catch (error) {
    console.error('Error scheduling follow-up chase logs:', error);
  }
};
