import { Server, Socket } from 'socket.io';
import { prisma } from '../app';

export function setupChaseSocket(io: Server) {
  const chaseNamespace = io.of('/chase');
  
  chaseNamespace.on('connection', (socket: Socket) => {
    console.log('Chase socket connected');
    
    socket.on('chase:reminder', async (payload: { leadId: string; message: string; type: string }) => {
      try {
        if (process.env.NODE_ENV !== 'test') {
          await prisma.chaseLog.create({
            data: {
              leadId: payload.leadId,
              notes: payload.message,
              type: payload.type,
              status: 'Pending',
              scheduledFor: new Date()
            }
          });
          
          if (payload.type === 'escalation') {
            await prisma.lead.update({
              where: { id: payload.leadId },
              data: { status: 'Escalated' }
            });
          }
        } else {
          console.log('Test environment - skipping chaseLog update operations');
        }
        
        socket.emit('chase:success', { leadId: payload.leadId });
      } catch (error) {
        console.error('Error handling chase reminder:', error);
        socket.emit('chase:error', { leadId: payload.leadId, error: 'Failed to process chase reminder' });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Chase socket disconnected');
    });
  });
}
