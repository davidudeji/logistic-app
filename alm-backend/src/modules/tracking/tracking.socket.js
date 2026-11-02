import { authenticateTrackingToken } from './tracking.integration.js';
import { trackingEvents } from './tracking.events.js';
import { trackingService } from './tracking.service.js';

function trackingRoom(tenantId, jobId) {
  return `tracking:${encodeURIComponent(tenantId)}:${encodeURIComponent(jobId)}`;
}

function emitTrackingError(socket, error, jobId) {
  socket.emit('tracking:error', {
    jobId,
    code: error.code || 'TRACKING_SUBSCRIPTION_FAILED',
    message: error.status && error.status < 500
      ? error.message
      : 'Could not authorize this tracking subscription.',
  });
}

export function attachTrackingSocketHandlers(io, service = trackingService) {
  io.use(async (socket, next) => {
    try {
      const user = await authenticateTrackingToken(socket.handshake.auth?.token);
      if (!user || typeof user.id !== 'string' || typeof user.role !== 'string') {
        return next(new Error('Tracking authentication returned an invalid identity.'));
      }
      socket.data.trackingUser = user;
      return next();
    } catch (error) {
      const socketError = new Error(error.status === 503
        ? 'Tracking authentication is not configured.'
        : 'Tracking authentication failed.');
      socketError.data = { code: error.code || 'UNAUTHORIZED' };
      return next(socketError);
    }
  });

  io.on('connection', (socket) => {
    socket.data.trackingSubscriptions = new Map();

    socket.on('tracking:subscribe', async (payload) => {
      const jobId = payload?.jobId;
      if (typeof jobId !== 'string' || !jobId.trim() || jobId.length > 160) {
        socket.emit('tracking:error', {
          code: 'VALIDATION_ERROR',
          message: 'A valid job ID is required.',
        });
        return;
      }

      try {
        const scope = await service.authorizeSocketSubscription(
          jobId,
          socket.data.trackingUser
        );
        const room = trackingRoom(scope.tenantId, scope.jobId);
        await socket.join(room);
        socket.data.trackingSubscriptions.set(jobId, room);
      } catch (error) {
        emitTrackingError(socket, error, jobId);
      }
    });

    socket.on('tracking:unsubscribe', (payload) => {
      const jobId = payload?.jobId;
      const room = socket.data.trackingSubscriptions.get(jobId);
      if (!room) return;
      socket.leave(room);
      socket.data.trackingSubscriptions.delete(jobId);
    });

    socket.on('disconnect', () => {
      socket.data.trackingSubscriptions.clear();
    });
  });

  const deliverPosition = async (event) => {
    const room = trackingRoom(event.tenantId, event.jobId);
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
      try {
        const scope = await service.authorizeSocketSubscription(
          event.jobId,
          socket.data.trackingUser
        );
        if (scope.tenantId !== event.tenantId) {
          socket.leave(room);
          socket.data.trackingSubscriptions?.delete(event.jobId);
          continue;
        }
        socket.emit('tracking:position', event.point);
      } catch (error) {
        socket.leave(room);
        socket.data.trackingSubscriptions?.delete(event.jobId);
        emitTrackingError(socket, error, event.jobId);
      }
    }
  };
  let positionQueue = Promise.resolve();
  const forwardPosition = (event) => {
    positionQueue = positionQueue
      .then(() => deliverPosition(event))
      .catch((error) => {
        console.error(`[Tracking Socket] Could not publish update: ${error.message}`);
      });
  };

  trackingEvents.on('position', forwardPosition);
  return () => trackingEvents.off('position', forwardPosition);
}
