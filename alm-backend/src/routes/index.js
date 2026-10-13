import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { validateRequest } from '../middleware/validate-request.js';

import { telemetryController } from '../modules/telemetry/telemetry.controller.js';
import { routingController } from '../modules/routing/routing.controller.js';
import { validateOptimizeRouteRequest } from '../modules/routing/routing.validation.js';
import { etaController } from '../modules/eta/eta.controller.js';
import { deliveryController } from '../modules/deliveries/delivery.controller.js';
import { epodController } from '../modules/epod/epod.controller.js';
import { syncController } from '../modules/sync/sync.controller.js';

export const router = Router();

// Apply general rate limiter
router.use(rateLimit({ windowMs: 60000, max: 200 }));

// ── Health Check ─────────────────────────────────────────────
router.get('/alm/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Automated Logistics Module (ALM) Backend',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ── Fleet Telemetry Endpoints ─────────────────────────────────
router.get(
  '/fleet/telemetry',
  authenticate,
  authorize(['Fleet Manager', 'Dispatcher', 'Operations Manager', 'Administrator']),
  (req, res, next) => telemetryController.getFleetTelemetry(req, res, next)
);

router.get(
  '/fleet/:assetId/telemetry',
  authenticate,
  authorize(['Fleet Manager', 'Dispatcher', 'Operations Manager', 'Administrator']),
  (req, res, next) => telemetryController.getVehicleTelemetryHistory(req, res, next)
);

// ── Route Optimization Endpoints ──────────────────────────────
router.post(
  '/routes/optimize',
  authenticate,
  authorize(['Dispatcher', 'Operations Manager', 'Administrator']),
  validateRequest(validateOptimizeRouteRequest),
  (req, res, next) => routingController.optimizeRoute(req, res, next)
);

router.post(
  '/routes/:routeId/confirm',
  authenticate,
  authorize(['Dispatcher', 'Operations Manager', 'Administrator']),
  (req, res, next) => routingController.confirmRoute(req, res, next)
);

router.get(
  '/routes/:routeId',
  authenticate,
  (req, res, next) => routingController.getRoute(req, res, next)
);

// ── Predictive ETA Endpoints ──────────────────────────────────
router.post(
  '/eta/predict',
  authenticate,
  (req, res, next) => etaController.predictEta(req, res, next)
);

// ── Proof of Delivery (ePOD) Endpoints ────────────────────────
router.post(
  '/deliveries/:deliveryId/epod',
  authenticate,
  authorize(['Driver', 'Administrator', 'Fleet Manager']),
  (req, res, next) => epodController.uploadEpod(req, res, next)
);

router.get(
  '/deliveries/:deliveryId/epod',
  authenticate,
  authorize(['Auditor', 'Operations Manager', 'Administrator', 'Fleet Manager', 'Driver']),
  (req, res, next) => epodController.getEpodMetadata(req, res, next)
);

router.get(
  '/epod/:epodId/download-url',
  authenticate,
  authorize(['Auditor', 'Operations Manager', 'Administrator', 'Fleet Manager']),
  (req, res, next) => epodController.getDownloadUrl(req, res, next)
);

// ── Delivery Status & Offline Sync Endpoints ──────────────────
router.patch(
  '/deliveries/:deliveryId/status',
  authenticate,
  (req, res, next) => deliveryController.updateStatus(req, res, next)
);

router.post(
  '/deliveries/sync',
  authenticate,
  (req, res, next) => syncController.syncMutations(req, res, next)
);
