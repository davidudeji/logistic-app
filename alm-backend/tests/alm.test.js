import test from 'node:test';
import assert from 'node:assert/strict';

import { telemetryService } from '../src/modules/telemetry/telemetry.service.js';
import { routingService } from '../src/modules/routing/routing.service.js';
import { etaService } from '../src/modules/eta/eta.service.js';
import { epodService } from '../src/modules/epod/epod.service.js';
import { syncService } from '../src/modules/sync/sync.service.js';

test('ALM Feature A: Telemetry validation and ingestion', async (t) => {
  await t.test('accepts valid driver location broadcast', () => {
    const ping = telemetryService.validateAndIngestBroadcast({
      assetId: 'VEH-TRK-TEST',
      longitude: 3.35,
      latitude: 6.6,
      heading: 90,
      speedKph: 50,
      telemetryTimestamp: new Date().toISOString(),
    });

    assert.equal(ping.assetId, 'VEH-TRK-TEST');
    assert.equal(ping.speedKph, 50);
    assert.ok(ping.eventId);
    assert.ok(ping.receivedAt);
  });

  await t.test('rejects invalid coordinates', () => {
    assert.throws(() => {
      telemetryService.validateAndIngestBroadcast({
        assetId: 'VEH-TRK-TEST',
        longitude: 250, // invalid lon
        latitude: 6.6,
        telemetryTimestamp: new Date().toISOString(),
      });
    }, /longitude must be a valid number between -180 and 180/);
  });

  await t.test('rejects future timestamps > 10m', () => {
    const farFuture = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    assert.throws(() => {
      telemetryService.validateAndIngestBroadcast({
        assetId: 'VEH-TRK-TEST',
        longitude: 3.35,
        latitude: 6.6,
        telemetryTimestamp: farFuture,
      });
    }, /cannot be more than 10 minutes in the future/);
  });
});

test('ALM Feature B: Route optimization sequence mapping', async (t) => {
  await t.test('preserves original delivery IDs and calculates route', async () => {
    const deliveryIds = ['DEL-001', 'DEL-002', 'DEL-003'];
    const result = await routingService.optimizeRoute({
      assetId: 'VEH-TRK-101',
      deliveryIds,
      origin: [3.35, 6.6],
      destination: [3.42, 6.42],
    });

    assert.equal(result.assetId, 'VEH-TRK-101');
    assert.equal(result.orderedDeliveryIds.length, 3);
    for (const id of deliveryIds) {
      assert.ok(result.orderedDeliveryIds.includes(id));
    }
    assert.ok(result.totalDistanceMeters > 0);
    assert.ok(result.estimatedDurationSeconds > 0);
  });

  await t.test('confirms route proposals before applying to operational dispatch', async () => {
    const confirmation = await routingService.confirmRoute('RT-CONF-999', {
      optimizationId: 'opt_test_1',
      assetId: 'VEH-TRK-101',
      orderedDeliveryIds: ['DEL-002', 'DEL-001'],
    });

    assert.equal(confirmation.status, 'confirmed');
    assert.equal(confirmation.totalStops, 2);
    assert.ok(confirmation.confirmedAt);
  });
});

test('ALM Feature C: Predictive traffic-aware ETA', async (t) => {
  await t.test('bounds traffic multiplier and computes adjusted arrival', async () => {
    const eta = await etaService.predictEta({
      assetId: 'VEH-TRK-101',
      deliveryId: 'DEL-001',
      origin: [3.3515, 6.6018],
      destination: [3.4219, 6.4281],
      trafficWeight: 1.35,
    });

    assert.equal(eta.trafficWeight, 1.35);
    assert.ok(eta.predictedDurationSeconds >= eta.baselineDurationSeconds);
    assert.ok(new Date(eta.predictedArrivalTimestamp) > new Date(eta.departureTimestamp));
  });

  await t.test('clamps out-of-bounds traffic weights', async () => {
    const eta = await etaService.predictEta({
      assetId: 'VEH-TRK-101',
      deliveryId: 'DEL-001',
      origin: [3.3515, 6.6018],
      destination: [3.4219, 6.4281],
      trafficWeight: 10.0, // should clamp to 3.0 max
    });

    assert.equal(eta.trafficWeight, 3.0);
  });
});

test('ALM Feature D: Proof of Delivery (ePOD) and AI document audit', async (t) => {
  await t.test('persists document and validates AI audit schema', async () => {
    const fakeBuffer = Buffer.from('test_epod_image_data_2026');
    const res = await epodService.processEpodUpload(
      'DEL-001',
      fakeBuffer,
      'image/jpeg',
      { receiverName: 'Test Recipient', deliveryNotes: 'Gate 2 delivery' }
    );

    assert.equal(res.deliveryId, 'DEL-001');
    assert.ok(res.epodId);
    assert.ok(res.status);
    assert.ok(res.audit);
    assert.equal(typeof res.audit.damagedCargo, 'boolean');
    assert.equal(typeof res.audit.manifestAuditNotes, 'string');
  });
});

test('ALM Feature E: Offline batch synchronization', async (t) => {
  await t.test('processes queued mutations and guarantees idempotency', () => {
    const mutation = {
      id: 'mut_local_1',
      deliveryId: 'DEL-001',
      clientMutationId: 'cmid_unique_123',
      status: 'DELIVERED',
      createdAt: new Date().toISOString(),
      payload: { receiverName: 'A. Adeleke' },
      attempts: 0,
    };

    const firstRun = syncService.processBatchSync([mutation]);
    assert.equal(firstRun.processedCount, 1);
    assert.equal(firstRun.successCount, 1);
    assert.equal(firstRun.results[0].status, 'DELIVERED');

    // Replay identical clientMutationId
    const secondRun = syncService.processBatchSync([mutation]);
    assert.equal(secondRun.successCount, 1);
    assert.equal(secondRun.results[0].status, 'DELIVERED');
  });
});
