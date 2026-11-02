import http from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { Server as SocketIOServer } from 'socket.io';
import { app } from './app.js';
import { config } from './config/env.js';
import { prisma } from './config/prisma.js';
import {
  configureTrackingIntegration,
  isTrackingIntegrationConfigured,
} from './modules/tracking/tracking.integration.js';
import { attachTrackingSocketHandlers } from './modules/tracking/tracking.socket.js';
import { trackingService } from './modules/tracking/tracking.service.js';

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

async function startServer() {
  if (config.tracking.integrationModule) {
    const moduleUrl = pathToFileURL(resolve(config.tracking.integrationModule));
    const integrationModule = await import(moduleUrl.href);
    if (typeof integrationModule.configure !== 'function') {
      throw new Error(
        'TRACKING_INTEGRATION_MODULE must export an async configure({ configureTrackingIntegration, prisma }) function.'
      );
    }
    await integrationModule.configure({ configureTrackingIntegration, prisma });
  }

  attachTrackingSocketHandlers(io);
  if (config.env === 'production' && !isTrackingIntegrationConfigured()) {
    console.error(
      '[Tracking] Live tracking is disabled until production authentication and job assignment providers are configured.'
    );
  }

  const runRetention = async () => {
    try {
      const result = await trackingService.deleteExpiredPoints();
      console.info(`[Tracking retention] Deleted ${result.count} points older than ${config.tracking.retentionDays} days.`);
    } catch (error) {
      console.error(`[Tracking retention] Cleanup failed: ${error.message}`);
    }
  };
  void runRetention();
  const retentionTimer = setInterval(runRetention, 24 * 60 * 60 * 1000);
  retentionTimer.unref();

  server.listen(config.port, () => {
    console.log(`====================================================`);
    console.log(`🚀 Automated Logistics Module (ALM) Backend Service`);
    console.log(`📡 Listening on http://localhost:${config.port}`);
    console.log(`🔌 Socket.IO endpoint active on port ${config.port}`);
    console.log(`🌍 Environment: ${config.env}`);
    console.log(`====================================================`);
  });
}

void startServer().catch((error) => {
  console.error(`[ALM startup] ${error.message}`);
  process.exitCode = 1;
});

export { server, io };
