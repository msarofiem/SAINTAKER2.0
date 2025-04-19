import { Server } from 'socket.io';
import http from 'http';
import chaseSocket from './chaseSocket';
import notificationSocket from './notificationSocket';

export default function setupSockets(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: '*', // In production, restrict to your domains
      methods: ['GET', 'POST']
    }
  });
  
  const chaseNamespace = io.of('/chase');
  const notificationNamespace = io.of('/notification');
  
  chaseSocket(chaseNamespace);
  notificationSocket(notificationNamespace);
  
  return io;
}
