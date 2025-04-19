import http from 'http';
import app, { prisma } from './app';
import dotenv from 'dotenv';
import { initSocketServer } from './sockets';
import { startTouchpointScheduler } from './scheduler/touchpointScheduler';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

initSocketServer(server);

startTouchpointScheduler();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server running`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});
