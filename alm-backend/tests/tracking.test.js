import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { errorHandler } from '../src/middleware/error-handler.js';
import { app } from '../src/app.js';
import { TrackingController } from '../src/modules/tracking/tracking.controller.js';
import { trackingEvents } from '../src/modules/tracking/tracking.events.js';
import { createTrackingRouter } from '../src/modules/tracking/tracking.routes.js';
import { TrackingService } from '../src/modules/tracking/tracking.service.js';
import { createTrackingRequestAuthenticator } from '../src/modules/tracking/tracking.integration.js';
import {
  isValidPublicTrackingToken,
  validateTrackingPoints,
} from '../src/modules/tracking/tracking.validation.js';

const tenantId = 'tenant-tracking-test';
const driver = { id: 'driver-1', role: 'Driver', tenantId };
const dispatcher = { id: 'dispatcher-1', role: 'Dispatcher', tenantId };

function createAssignment(overrides = {}) {
  return {
    tenantId,
    jobId: 'JOB-001',
    driverId: driver.id,
    vehicleId: 'VEH-001',
    driverFirstName: 'Ada',
    driverPhone: '+234 800 000 0000',
    vehicleRegistration: 'ABC-123',
    status: 'in_transit',
    deliveredAt: null,
    ...overrides,
  };
}

function createFakePrisma() {
  const points = [];
  const tokens = new Map();
  return {
    points,
    tokens,
    locationPoint: {
      createMany: async ({ data }) => {
        points.push(...data);
        return { count: data.length };
      },
      findFirst: async ({ where }) => points
        .filter((point) =>
          point.tenantId === where.tenantId && point.jobId === where.jobId
        )
        .sort((left, right) => right.recordedAt - left.recordedAt)[0] ?? null,
      findMany: async ({ where, take = 5000 }) => points
        .filter((point) =>
          point.tenantId === where.tenantId &&
          (typeof where.jobId === 'string'
            ? point.jobId === where.jobId
            : where.jobId.in.includes(point.jobId))
        )
        .sort((left, right) => right.recordedAt - left.recordedAt)
        .slice(0, take),
      deleteMany: async ({ where }) => {
        const remaining = points.filter((point) => point.recordedAt >= where.recordedAt.lt);
        const count = points.length - remaining.length;
        points.splice(0, points.length, ...remaining);
        return { count };
      },
    },
    publicTrackingToken: {
      create: async ({ data }) => {
        tokens.set(data.tokenHash, { revokedAt: null, ...data });
        return data;
      },
      findUnique: async ({ where }) => tokens.get(where.tokenHash) ?? null,
      update: async ({ where, data }) => {
        const token = tokens.get(where.tokenHash);
        Object.assign(token, data);
        return token;
      },
    },
  };
}

function createAssignmentProvider(assignment) {
  return {
    getDriverAssignment: async (jobId) => jobId === assignment.jobId ? assignment : null,
    getDispatcherJob: async (jobId, user) =>
      user.tenantId === assignment.tenantId && jobId === assignment.jobId ? assignment : null,
    listActiveJobs: async () => assignment.status === 'delivered' ? [] : [assignment],
    getPublicJob: async (jobId, scopedTenantId) =>
      jobId === assignment.jobId && scopedTenantId === assignment.tenantId ? assignment : null,
  };
}

function makePoint(jobId, timestamp, overrides = {}) {
  return {
    jobId,
    lat: 6.5244,
    lng: 3.3792,
    accuracy: 10,
    speed: 5,
    heading: 90,
    timestamp,
    ...overrides,
  };
}

test('tracking point validation rejects invalid coordinates, batches and timestamps', () => {
  const now = Date.now();
  const valid = makePoint('JOB-001', new Date(now).toISOString());
  assert.equal(validateTrackingPoints({ points: [valid] }, 'JOB-001', now), null);
  assert.match(
    validateTrackingPoints({ points: [{ ...valid, lat: 91 }] }, 'JOB-001', now),
    /latitude/
  );
  assert.match(
    validateTrackingPoints({ points: [valid] }, 'JOB-002', now),
    /does not match/
  );
  assert.match(
    validateTrackingPoints({ points: [{ ...valid, timestamp: 'invalid' }] }, 'JOB-001', now),
    /timestamp/
  );
  assert.match(validateTrackingPoints({ points: [] }, 'JOB-001', now), /between 1 and 100/);
});

test('production tracking authentication fails closed without an adapter', () => {
  const authenticate = createTrackingRequestAuthenticator({ environment: 'production' });
  const response = {
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let nextCalled = false;

  authenticate({ id: 'request-1' }, response, () => { nextCalled = true; });

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error.code, 'TRACKING_AUTH_PROVIDER_NOT_CONFIGURED');
  assert.equal(nextCalled, false);
});

test('tracking service persists assigned driver points and returns ordered scoped data', async (t) => {
  const assignment = createAssignment();
  const prisma = createFakePrisma();
  const service = new TrackingService({
    prisma,
    assignments: createAssignmentProvider(assignment),
  });
  const events = [];
  const listener = (event) => events.push(event);
  trackingEvents.on('position', listener);
  t.after(() => trackingEvents.off('position', listener));

  const later = makePoint(assignment.jobId, '2026-11-02T00:00:10.000Z');
  const earlier = makePoint(assignment.jobId, '2026-11-02T00:00:00.000Z');
  const result = await service.uploadPoints(assignment.jobId, driver, [later, earlier]);

  assert.deepEqual(result, { accepted: 2 });
  assert.deepEqual(
    prisma.points.map((point) => point.recordedAt.toISOString()),
    [earlier.timestamp, later.timestamp]
  );
  assert.ok(prisma.points.every((point) => point.vehicleId === assignment.vehicleId));
  assert.equal(events.length, 2);

  const active = await service.listActiveJobs(dispatcher);
  assert.equal(active.length, 1);
  assert.equal(active[0].latestPosition.timestamp, later.timestamp);
  assert.deepEqual(
    (await service.getHistory(assignment.jobId, dispatcher)).map((point) => point.timestamp),
    [earlier.timestamp, later.timestamp]
  );
});

test('tracking service rejects unassigned drivers and cross-tenant dispatchers', async () => {
  const assignment = createAssignment();
  const service = new TrackingService({
    prisma: createFakePrisma(),
    assignments: createAssignmentProvider(assignment),
  });

  await assert.rejects(
    service.uploadPoints(assignment.jobId, { ...driver, id: 'another-driver' }, [
      makePoint(assignment.jobId, new Date().toISOString()),
    ]),
    { code: 'TRACKING_JOB_NOT_ASSIGNED', status: 403 }
  );
  await assert.rejects(
    service.getHistory(assignment.jobId, { ...dispatcher, tenantId: 'another-tenant' }),
    { code: 'TRACKING_JOB_NOT_FOUND', status: 404 }
  );
});

test('public links store only token hashes and expire two hours after delivery', async () => {
  const assignment = createAssignment();
  const prisma = createFakePrisma();
  let now = new Date('2026-11-02T00:00:00.000Z');
  const service = new TrackingService({
    prisma,
    assignments: createAssignmentProvider(assignment),
    now: () => new Date(now),
    deliveryGraceMs: 2 * 60 * 60 * 1000,
  });

  const link = await service.createPublicToken(assignment.jobId, dispatcher);
  assert.equal(isValidPublicTrackingToken(link.token), true);
  assert.equal(link.expiresAt, null);
  assert.equal(prisma.tokens.size, 1);
  assert.equal(prisma.tokens.has(link.token), false);

  await service.uploadPoints(
    assignment.jobId,
    driver,
    [makePoint(assignment.jobId, now.toISOString())]
  );
  const snapshot = await service.getPublicSnapshot(link.token);
  assert.deepEqual(Object.keys(snapshot).sort(), [
    'driverFirstName',
    'driverPhone',
    'eta',
    'lastUpdatedAt',
    'position',
    'status',
    'vehicleRegistration',
  ]);
  assert.deepEqual(snapshot.position, { lat: 6.5244, lng: 3.3792 });

  assignment.status = 'delivered';
  assignment.deliveredAt = new Date('2026-11-02T00:00:00.000Z');
  now = new Date('2026-11-02T02:00:01.000Z');
  await assert.rejects(service.getPublicSnapshot(link.token), {
    code: 'TRACKING_LINK_EXPIRED',
    status: 410,
  });
  assert.equal(
    [...prisma.tokens.values()][0].expiresAt.toISOString(),
    '2026-11-02T02:00:00.000Z'
  );
});

test('tracking retention removes points older than the configured window', async () => {
  const prisma = createFakePrisma();
  const assignment = createAssignment();
  const now = new Date('2026-11-02T00:00:00.000Z');
  const service = new TrackingService({
    prisma,
    assignments: createAssignmentProvider(assignment),
    now: () => now,
  });
  await prisma.locationPoint.createMany({
    data: [
      {
        tenantId,
        jobId: assignment.jobId,
        vehicleId: assignment.vehicleId,
        lat: 1,
        lng: 1,
        accuracy: 1,
        speed: null,
        heading: null,
        recordedAt: new Date('2026-10-01T00:00:00.000Z'),
      },
      {
        tenantId,
        jobId: assignment.jobId,
        vehicleId: assignment.vehicleId,
        lat: 2,
        lng: 2,
        accuracy: 1,
        speed: null,
        heading: null,
        recordedAt: new Date('2026-10-10T00:00:00.000Z'),
      },
    ],
  });

  const result = await service.deleteExpiredPoints();
  assert.equal(result.count, 1);
  assert.equal(prisma.points.length, 1);
});

test('tracking HTTP routes enforce driver role, validation and public read-only access', async () => {
  const calls = [];
  const fakeService = {
    uploadPoints: async (...args) => {
      calls.push(['uploadPoints', ...args]);
      return { accepted: args[2].length };
    },
    listActiveJobs: async () => [{ jobId: 'JOB-001', latestPosition: null }],
    getHistory: async (jobId, user, limit) => [{ jobId, userId: user.id, limit }],
    createPublicToken: async (jobId) => ({ token: 'a'.repeat(43), expiresAt: null }),
    getPublicSnapshot: async () => ({
      driverFirstName: 'Ada',
      driverPhone: '+234 800 000 0000',
      vehicleRegistration: 'ABC-123',
      status: 'in_transit',
      position: null,
      lastUpdatedAt: null,
      eta: null,
    }),
    canDispatcherViewJob: async () => true,
    getPublicTrackingScope: async () => ({ tenantId, jobId: 'JOB-001' }),
  };
  const authenticate = (req, res, next) => {
    req.user = req.headers.authorization === 'Bearer driver' ? driver : dispatcher;
    next();
  };
  const app = express();
  app.use(express.json());
  app.use(createTrackingRouter({ controller: new TrackingController(fakeService), authenticate }));
  app.use(errorHandler);

  const validPoint = makePoint('JOB-001', new Date().toISOString());
  const accepted = await request(app)
    .post('/tracking/JOB-001/points')
    .set('Authorization', 'Bearer driver')
    .send({ points: [validPoint] });
  assert.equal(accepted.status, 202);
  assert.deepEqual(accepted.body, { accepted: 1 });

  const rejectedRole = await request(app)
    .post('/tracking/JOB-001/points')
    .set('Authorization', 'Bearer dispatcher')
    .send({ points: [validPoint] });
  assert.equal(rejectedRole.status, 403);

  const rejectedPoint = await request(app)
    .post('/tracking/JOB-001/points')
    .set('Authorization', 'Bearer driver')
    .send({ points: [{ ...validPoint, lng: 181 }] });
  assert.equal(rejectedPoint.status, 400);

  const publicSnapshot = await request(app).get(`/tracking/public/${'a'.repeat(43)}`);
  assert.equal(publicSnapshot.status, 200);
  assert.equal('jobId' in publicSnapshot.body, false);
  assert.equal('driverId' in publicSnapshot.body, false);

  assert.equal(calls.filter(([name]) => name === 'uploadPoints').length, 1);
});

test('application tracking routes fail closed without deployment assignment data', async () => {
  const response = await request(app)
    .get('/api/v1/tracking/active')
    .set('Authorization', 'Bearer development-test-token');

  assert.equal(response.status, 503);
  assert.ok([
    'TRACKING_AUTH_PROVIDER_NOT_CONFIGURED',
    'TRACKING_ASSIGNMENT_PROVIDER_NOT_CONFIGURED',
  ].includes(response.body.error.code));
});
