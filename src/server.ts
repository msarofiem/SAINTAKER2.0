import http from 'http';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

if (process.env.NODE_ENV !== 'production') {
  const { Server } = require('socket.io');
  const { setupSockets } = require('./sockets');
  
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST']
    }
  });

  setupSockets(io);
  
  console.log('Socket.IO server initialized in development/test mode');
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
