import { Namespace } from 'socket.io';
import { prisma } from '../app';

export const setupNotificationSocket = (namespace: Namespace) => {
  namespace.on('connection', (socket) => {
    console.log('Client connected to notifications namespace:', socket.id);
    
    socket.on('join:user', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined room for user ${userId}`);
    });
    
    socket.on('join:admin', () => {
      socket.join('admin');
      console.log(`Socket ${socket.id} joined admin room`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from notifications namespace:', socket.id);
    });
  });
  
  return namespace;
};

export const emitNewLeadNotification = async (leadId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        staffAssignment: {
          include: {
            staff: true
          }
        }
      }
    });
    
    if (!lead) {
      console.error(`Lead ${leadId} not found for notification emit`);
      return;
    }
    
    io.of('/notifications').to('admin').emit('notification:new', {
      type: 'lead:new',
      message: `New lead: ${lead.firstName} ${lead.lastName}`,
      data: lead,
      timestamp: new Date().toISOString()
    });
    
    if (lead.staffAssignment && lead.staffAssignment.staff) {
      io.of('/notifications').to(`user:${lead.staffAssignment.staff.id}`).emit('notification:new', {
        type: 'lead:assigned',
        message: `New lead assigned: ${lead.firstName} ${lead.lastName}`,
        data: lead,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Emitted lead:new notification for lead ${leadId}`);
  } catch (error) {
    console.error('Error emitting new lead notification:', error);
  }
};

export const emitDocumentSignedNotification = async (documentId: string, signatureId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const signature = await prisma.documentSignature.findUnique({
      where: { id: signatureId },
      include: {
        document: {
          include: {
            lead: {
              include: {
                staffAssignment: {
                  include: {
                    staff: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!signature || !signature.document || !signature.document.lead) {
      console.error(`Signature ${signatureId} or related data not found for notification emit`);
      return;
    }
    
    const lead = signature.document.lead;
    const documentType = signature.document.documentType || 'Document';
    
    io.of('/notifications').to('admin').emit('notification:new', {
      type: 'document:signed',
      message: `${documentType} signed by ${lead.firstName} ${lead.lastName}`,
      data: {
        signature,
        document: signature.document,
        lead
      },
      timestamp: new Date().toISOString()
    });
    
    if (lead.staffAssignment && lead.staffAssignment.staff) {
      io.of('/notifications').to(`user:${lead.staffAssignment.staff.id}`).emit('notification:new', {
        type: 'document:signed',
        message: `${documentType} signed by ${lead.firstName} ${lead.lastName}`,
        data: {
          signature,
          document: signature.document,
          lead
        },
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`Emitted document:signed notification for document ${documentId}`);
  } catch (error) {
    console.error('Error emitting document signed notification:', error);
  }
};

export const emitReferralFeedbackNotification = async (referralId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const referral = await prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        feedback: true,
        lead: true
      }
    });
    
    if (!referral || !referral.feedback) {
      console.error(`Referral ${referralId} or feedback not found for notification emit`);
      return;
    }
    
    const status = referral.feedback.status;
    const message = status === 'Accepted' 
      ? `Referral for ${referral.lead.firstName} ${referral.lead.lastName} was accepted`
      : `Referral for ${referral.lead.firstName} ${referral.lead.lastName} was declined`;
    
    io.of('/notifications').to('admin').emit('notification:new', {
      type: 'referral:feedback',
      message,
      data: referral,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Emitted referral:feedback notification for referral ${referralId}`);
  } catch (error) {
    console.error('Error emitting referral feedback notification:', error);
  }
};
