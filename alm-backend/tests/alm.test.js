import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

import { routingService } from '../src/modules/routing/routing.service.js';
import { etaService } from '../src/modules/eta/eta.service.js';
import { epodService } from '../src/modules/epod/epod.service.js';
import { syncService } from '../src/modules/sync/sync.service.js';

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

test('COD cash ledger records collections, matched remittances, and enforces the cap', async () => {
  const token = 'jwt_mock_token_alm_USR-ADMIN-01';
  const riderId = 'DRV-LEDGER-01';
  const orderId = 'ORD-LEDGER-01';

  const collection = await request(app)
    .post('/api/v1/cash-ledger/collections')
    .set('Authorization', `Bearer ${token}`)
    .send({ riderId, orderId, amountKobo: 3500000, clientMutationId: 'ledger-collect-01' });

  assert.equal(collection.status, 201);
  assert.equal(collection.body.entry.type, 'COD_COLLECTED');
  assert.equal(collection.body.balanceKobo, 3500000);

  const cap = await request(app)
    .put(`/api/v1/cash-ledger/riders/${riderId}/cap`)
    .set('Authorization', `Bearer ${token}`)
    .send({ capKobo: 3500000 });

  assert.equal(cap.status, 200);
  assert.equal(cap.body.assignmentEligible, false);

  const remittance = await request(app)
    .post('/api/v1/cash-ledger/remittances')
    .set('Authorization', `Bearer ${token}`)
    .send({
      riderId,
      reference: 'BANK-REF-LEDGER-01',
      clientMutationId: 'ledger-remit-01',
      allocations: [{ orderId, amountKobo: 3500000 }],
    });

  assert.equal(remittance.status, 201);
  assert.equal(remittance.body.balanceKobo, 0);
  assert.equal(remittance.body.assignmentEligible, true);

  const ledger = await request(app)
    .get(`/api/v1/cash-ledger/riders/${riderId}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(ledger.status, 200);
  assert.equal(ledger.body.entries.length, 2);
  assert.deepEqual(ledger.body.entries.map(entry => entry.type), ['COD_COLLECTED', 'REMITTANCE_MATCHED']);
});
