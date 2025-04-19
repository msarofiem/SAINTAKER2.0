import http from 'http';
import app from './app';
import dotenv from 'dotenv';
import setupSockets from './sockets';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = setupSockets(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server running`);
});
