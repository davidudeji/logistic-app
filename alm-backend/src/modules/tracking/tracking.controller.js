import { trackingEvents } from './tracking.events.js';
import { getTrackingAssignmentProvider } from './tracking.integration.js';

function sendEvent(res, name, data) {
  res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

function startEventStream(res) {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
}

function streamLifecycle(req, res, listener) {
  let closed = false;
  const cleanupTimers = [];
  const heartbeat = setInterval(() => {
    if (!closed) res.write(': keep-alive\n\n');
  }, 25_000);
  cleanupTimers.push(() => clearInterval(heartbeat));

  const close = () => {
    if (closed) return;
    closed = true;
    cleanupTimers.forEach((cleanup) => cleanup());
    trackingEvents.off('position', listener);
  };
  res.on('close', close);
  return {
    close,
    isClosed: () => closed,
    addInterval(callback, intervalMs) {
      const interval = setInterval(() => {
        if (!closed) void callback();
      }, intervalMs);
      cleanupTimers.push(() => clearInterval(interval));
    },
    scheduleExpiration(expiresAt, callback) {
      if (!expiresAt) return;
      const timeout = setTimeout(() => {
        if (!closed) callback();
      }, Math.max(0, new Date(expiresAt).getTime() - Date.now()));
      cleanupTimers.push(() => clearTimeout(timeout));
    },
  };
}

export class TrackingController {
  constructor(service) {
    this.service = service;
  }

  async uploadPoints(req, res, next) {
    try {
      const result = await this.service.uploadPoints(req.params.jobId, req.user, req.body.points);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listActiveJobs(req, res, next) {
    try {
      res.json(await this.service.listActiveJobs(req.user));
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      res.json(
        await this.service.getHistory(
          req.params.jobId,
          req.user,
          req.trackingHistoryLimit
        )
      );
    } catch (error) {
      next(error);
    }
  }

  async createPublicToken(req, res, next) {
    try {
      res.status(201).json(
        await this.service.createPublicToken(req.params.jobId, req.user)
      );
    } catch (error) {
      next(error);
    }
  }

  async getPublicSnapshot(req, res, next) {
    try {
      res.json(await this.service.getPublicSnapshot(req.params.token));
    } catch (error) {
      next(error);
    }
  }

  async streamDispatcher(req, res, next) {
    try {
      getTrackingAssignmentProvider();
      startEventStream(res);
      let eventQueue = Promise.resolve();
      let lifecycle;
      const listener = (event) => {
        eventQueue = eventQueue.then(async () => {
          if (lifecycle.isClosed() || event.tenantId !== req.user.tenantId) return;
          try {
            if (await this.service.canDispatcherViewJob(event.jobId, req.user)) {
              sendEvent(res, 'position', event.point);
            }
          } catch (error) {
            console.error(`[Tracking SSE] [${req.id}] Dispatcher stream authorization failed: ${error.message}`);
            sendEvent(res, 'error', { code: 'TRACKING_STREAM_AUTHORIZATION_FAILED' });
            lifecycle.close();
            res.end();
          }
        }).catch((error) => {
          if (lifecycle.isClosed()) return;
          console.error(`[Tracking SSE] [${req.id}] Dispatcher stream failed: ${error.message}`);
          sendEvent(res, 'error', { code: 'TRACKING_STREAM_FAILED' });
          lifecycle.close();
          res.end();
        });
      };
      lifecycle = streamLifecycle(req, res, listener);
      sendEvent(res, 'ready', { connected: true });
    } catch (error) {
      next(error);
    }
  }

  async streamPublic(req, res, next) {
    try {
      const scope = await this.service.getPublicTrackingScope(req.params.token);
      const initialSnapshot = await this.service.getPublicSnapshot(req.params.token);
      startEventStream(res);
      let eventQueue = Promise.resolve();
      let lifecycle;
      const listener = (event) => {
        eventQueue = eventQueue.then(async () => {
          if (
            lifecycle.isClosed() ||
            event.tenantId !== scope.tenantId ||
            event.jobId !== scope.jobId
          ) {
            return;
          }

          try {
            const snapshot = await this.service.getPublicSnapshot(req.params.token);
            sendEvent(res, 'snapshot', snapshot);
          } catch (error) {
            if (error.status === 410 || error.status === 404) {
              sendEvent(res, 'expired', { code: 'TRACKING_LINK_EXPIRED' });
            } else {
              console.error(`[Tracking SSE] [${req.id}] Public stream update failed: ${error.message}`);
              sendEvent(res, 'error', { code: 'TRACKING_STREAM_UPDATE_FAILED' });
            }
            lifecycle.close();
            res.end();
          }
        }).catch((error) => {
          if (lifecycle.isClosed()) return;
          console.error(`[Tracking SSE] [${req.id}] Public stream failed: ${error.message}`);
          sendEvent(res, 'error', { code: 'TRACKING_STREAM_FAILED' });
          lifecycle.close();
          res.end();
        });
      };
      lifecycle = streamLifecycle(req, res, listener);
      sendEvent(res, 'snapshot', initialSnapshot);
      const expireStream = () => {
        sendEvent(res, 'expired', { code: 'TRACKING_LINK_EXPIRED' });
        lifecycle.close();
        res.end();
      };
      lifecycle.scheduleExpiration(scope.expiresAt, expireStream);
      lifecycle.addInterval(async () => {
        try {
          const currentScope = await this.service.getPublicTrackingScope(req.params.token);
          if (currentScope.expiresAt) {
            lifecycle.scheduleExpiration(currentScope.expiresAt, expireStream);
          }
          sendEvent(
            res,
            'snapshot',
            await this.service.getPublicSnapshot(req.params.token)
          );
        } catch (error) {
          if (error.status === 404 || error.status === 410) {
            expireStream();
            return;
          }
          console.error(`[Tracking SSE] [${req.id}] Public heartbeat failed: ${error.message}`);
          sendEvent(res, 'error', { code: 'TRACKING_STREAM_UPDATE_FAILED' });
          lifecycle.close();
          res.end();
        }
      }, 25_000);
    } catch (error) {
      next(error);
    }
  }
}
