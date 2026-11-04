import { createHash } from 'node:crypto';
import { Router } from 'express';
import { config } from '../../config/env.js';
import { authorize } from '../../middleware/authorize.js';
import { rateLimitByKey } from '../../middleware/rate-limit.js';
import { trackingService } from './tracking.service.js';
import { authenticateTracking } from './tracking.integration.js';
import { TrackingController } from './tracking.controller.js';
import {
  isValidTrackingJobId,
  parseHistoryLimit,
  validateTrackingPoints,
} from './tracking.validation.js';

const DISPATCHER_ROLES = ['Dispatcher', 'Operations Manager', 'Administrator'];

function validateJobId(req, res, next) {
  if (!isValidTrackingJobId(req.params.jobId)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A valid job ID is required.',
        requestId: req.id || `req_${Date.now()}`,
        retryable: false,
      },
    });
  }
  return next();
}

function validatePoints(req, res, next) {
  const validationError = validateTrackingPoints(req.body, req.params.jobId);
  if (validationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: validationError,
        requestId: req.id || `req_${Date.now()}`,
        retryable: false,
      },
    });
  }
  return next();
}

function validateHistoryLimit(req, res, next) {
  const limit = parseHistoryLimit(req.query.limit);
  if (limit === null) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'History limit must be an integer between 1 and 5000.',
        requestId: req.id || `req_${Date.now()}`,
        retryable: false,
      },
    });
  }
  req.trackingHistoryLimit = limit;
  return next();
}

function tokenRateLimitKey(req) {
  const token = req.params.token ?? '';
  return `tracking-public:${createHash('sha256').update(token).digest('hex')}`;
}

export function createTrackingRouter({
  controller = new TrackingController(trackingService),
  authenticate = authenticateTracking,
} = {}) {
  const router = Router();
  const driverRateLimit = rateLimitByKey({
    max: config.tracking.driverRateLimitPerMinute,
    keyGenerator: (req) => `tracking-driver:${req.user.tenantId}:${req.user.id}`,
  });
  const publicRateLimit = rateLimitByKey({
    max: config.tracking.publicRateLimitPerMinute,
    keyGenerator: tokenRateLimitKey,
  });

  router.get(
    '/tracking/public/:token/stream',
    publicRateLimit,
    (req, res, next) => controller.streamPublic(req, res, next)
  );
  router.get(
    '/tracking/public/:token',
    publicRateLimit,
    (req, res, next) => controller.getPublicSnapshot(req, res, next)
  );
  router.get(
    '/tracking/stream',
    authenticate,
    authorize(DISPATCHER_ROLES),
    (req, res, next) => controller.streamDispatcher(req, res, next)
  );
  router.get(
    '/tracking/active',
    authenticate,
    authorize(DISPATCHER_ROLES),
    (req, res, next) => controller.listActiveJobs(req, res, next)
  );
  router.post(
    '/tracking/:jobId/points',
    authenticate,
    authorize(['Driver']),
    driverRateLimit,
    validateJobId,
    validatePoints,
    (req, res, next) => controller.uploadPoints(req, res, next)
  );
  router.get(
    '/tracking/:jobId/history',
    authenticate,
    authorize(DISPATCHER_ROLES),
    validateJobId,
    validateHistoryLimit,
    (req, res, next) => controller.getHistory(req, res, next)
  );
  router.post(
    '/tracking/:jobId/public-token',
    authenticate,
    authorize(DISPATCHER_ROLES),
    validateJobId,
    (req, res, next) => controller.createPublicToken(req, res, next)
  );

  return router;
}

export const trackingRouter = createTrackingRouter();
