import { Namespace } from 'socket.io';
import { prisma } from '../app';
import { verifyToken } from '../utils/auth';

export default function chaseSocket(io: Namespace) {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = verifyToken(token);
      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Chase socket connected', socket.id);
    
    socket.join('chase:all');
    
    socket.on('chase:reminder', async (payload) => {
      try {
        const { leadId, type, notes } = payload;
        
        await prisma.chaseLog.update({
          where: { id: payload.chaseLogId },
          data: {
            status: 'Completed',
            completedAt: new Date(),
            notes: notes || 'Reminder completed'
          }
        });
        
        io.to(`lead:${leadId}`).emit('chase:updated', {
          leadId,
          type,
          status: 'Completed',
          timestamp: new Date()
        });
        
        console.log(`Chase reminder completed for lead ${leadId}`);
      } catch (error) {
        console.error('Error processing chase reminder:', error);
        socket.emit('chase:error', { error: 'Failed to process reminder' });
      }
    });
    
    socket.on('chase:overdue:check', async () => {
      try {
        const now = new Date();
        const overdueLogs = await prisma.chaseLog.findMany({
          where: {
            status: 'Pending',
            scheduledFor: {
              lt: now
            }
          },
          include: {
            lead: true
          }
        });
        
        if (overdueLogs.length > 0) {
          socket.emit('chase:overdue', { overdueLogs });
        }
      } catch (error) {
        console.error('Error checking overdue chase logs:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Chase socket disconnected', socket.id);
    });
  });
}
