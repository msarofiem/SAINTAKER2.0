import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupChaseSocket } from './chaseSocket';
import { setupNotificationSocket } from './notificationSocket';

let io: SocketServer;

export const initSocketServer = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });
  
  setupChaseSocket(io.of('/chase'));
  setupNotificationSocket(io.of('/notifications'));
  
  console.log('Socket.IO server initialized');
  
  return io;
};

export const getSocketServer = () => {
  if (!io) {
    throw new Error('Socket.IO server not initialized');
  }
  return io;
};
