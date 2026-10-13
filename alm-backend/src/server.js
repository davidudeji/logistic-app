import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app.js';
import { config } from './config/env.js';
import { setupTelemetrySocket } from './modules/telemetry/telemetry.socket.js';

const server = http.createServer(app);

// Attach Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Setup real-time telemetry events
setupTelemetrySocket(io);

server.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Automated Logistics Module (ALM) Backend Service`);
  console.log(`📡 Listening on http://localhost:${config.port}`);
  console.log(`🔌 Socket.IO endpoint active on port ${config.port}`);
  console.log(`🌍 Environment: ${config.env}`);
  console.log(`====================================================`);
});

export { server, io };
