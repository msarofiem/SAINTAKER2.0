import { Server } from 'socket.io';
import { setupChaseSocket } from './chaseSocket';

export function setupSockets(io: Server) {
  setupChaseSocket(io);
  
}
