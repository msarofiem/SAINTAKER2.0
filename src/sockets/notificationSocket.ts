import { Namespace } from 'socket.io';
import { verifyToken } from '../utils/auth';

export default function notificationSocket(io: Namespace) {
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
    console.log('Notification socket connected', socket.id);
    
    socket.join('notifications:all');
    
    const leadId = socket.handshake.query.leadId;
    if (leadId) {
      socket.join(`lead:${leadId}`);
    }
    
    socket.on('message:new', async (payload) => {
      try {
        const { leadId, message, sender } = payload;
        
        
        io.to(`lead:${leadId}`).emit('message:new', {
          leadId,
          message,
          sender,
          timestamp: new Date()
        });
        
        console.log(`New message for lead ${leadId}`);
      } catch (error) {
        console.error('Error processing new message:', error);
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });
    
    socket.on('lead:new', (payload) => {
      io.to('notifications:all').emit('lead:new', payload);
    });
    
    socket.on('disconnect', () => {
      console.log('Notification socket disconnected', socket.id);
    });
  });
}
