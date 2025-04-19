import { Namespace } from 'socket.io';
import { prisma } from '../app';

export const setupChaseSocket = (namespace: Namespace) => {
  namespace.on('connection', (socket) => {
    console.log('Client connected to chase namespace:', socket.id);
    
    socket.on('join:lead', (leadId: string) => {
      socket.join(`lead:${leadId}`);
      console.log(`Socket ${socket.id} joined room for lead ${leadId}`);
    });
    
    socket.on('leave:lead', (leadId: string) => {
      socket.leave(`lead:${leadId}`);
      console.log(`Socket ${socket.id} left room for lead ${leadId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from chase namespace:', socket.id);
    });
  });
  
  return namespace;
};

export const emitChaseLogCreated = async (chaseLogId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const chaseLog = await prisma.chaseLog.findUnique({
      where: { id: chaseLogId },
      include: {
        lead: true
      }
    });
    
    if (!chaseLog) {
      console.error(`Chase log ${chaseLogId} not found for socket emit`);
      return;
    }
    
    io.of('/chase').to(`lead:${chaseLog.leadId}`).emit('chase:new', {
      chaseLog,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Emitted chase:new event for chase log ${chaseLogId}`);
  } catch (error) {
    console.error('Error emitting chase log created event:', error);
  }
};

export const emitChaseLogUpdated = async (chaseLogId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const chaseLog = await prisma.chaseLog.findUnique({
      where: { id: chaseLogId },
      include: {
        lead: true
      }
    });
    
    if (!chaseLog) {
      console.error(`Chase log ${chaseLogId} not found for socket emit`);
      return;
    }
    
    io.of('/chase').to(`lead:${chaseLog.leadId}`).emit('chase:updated', {
      chaseLog,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Emitted chase:updated event for chase log ${chaseLogId}`);
  } catch (error) {
    console.error('Error emitting chase log updated event:', error);
  }
};

export const emitChaseLogOverdue = async (chaseLogId: string) => {
  try {
    const { getSocketServer } = require('./index');
    const io = getSocketServer();
    
    const chaseLog = await prisma.chaseLog.findUnique({
      where: { id: chaseLogId },
      include: {
        lead: true
      }
    });
    
    if (!chaseLog) {
      console.error(`Chase log ${chaseLogId} not found for socket emit`);
      return;
    }
    
    io.of('/chase').to(`lead:${chaseLog.leadId}`).emit('chase:overdue', {
      chaseLog,
      timestamp: new Date().toISOString()
    });
    
    io.of('/notifications').emit('notification:new', {
      type: 'chase:overdue',
      message: `Overdue chase for ${chaseLog.lead.firstName} ${chaseLog.lead.lastName}`,
      data: chaseLog,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Emitted chase:overdue event for chase log ${chaseLogId}`);
  } catch (error) {
    console.error('Error emitting chase log overdue event:', error);
  }
};
