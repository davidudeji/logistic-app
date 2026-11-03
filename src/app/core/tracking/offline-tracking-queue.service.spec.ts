import { TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';
import { vi } from 'vitest';
import { TrackingPoint } from '../../features/tracking/tracking.model';
import { OfflineTrackingQueueService } from './offline-tracking-queue.service';

describe('OfflineTrackingQueueService', () => {
  let service: OfflineTrackingQueueService;

  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    TestBed.configureTestingModule({ providers: [OfflineTrackingQueueService] });
    service = TestBed.inject(OfflineTrackingQueueService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('returns queued points in timestamp order and drops points older than 24 hours', async () => {
    const now = Date.now();
    const basePoint: TrackingPoint = {
      jobId: 'JOB-001',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: null,
      heading: null,
      timestamp: new Date(now).toISOString(),
    };
    const newest = { ...basePoint, timestamp: new Date(now - 10_000).toISOString() };
    const oldest = { ...basePoint, timestamp: new Date(now - 20_000).toISOString() };
    const expired = { ...basePoint, timestamp: new Date(now - 25 * 60 * 60 * 1000).toISOString() };

    await service.enqueue(newest);
    await service.enqueue(expired);
    await service.enqueue(oldest);

    const batch = await service.getOldestBatch('JOB-001', 10);
    expect(batch.map(({ timestamp }) => timestamp)).toEqual([oldest.timestamp, newest.timestamp]);
    expect(await service.count('JOB-001')).toBe(2);

    await service.remove(batch.map(({ id }) => id));
    expect(await service.count('JOB-001')).toBe(0);
  });

  it('limits results to the requested job and batch size', async () => {
    const point: TrackingPoint = {
      jobId: 'JOB-001',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: 0,
      heading: null,
      timestamp: new Date().toISOString(),
    };
    await service.enqueue(point);
    await service.enqueue({ ...point, jobId: 'JOB-002' });
    await service.enqueue({ ...point, timestamp: new Date(Date.now() + 1_000).toISOString() });

    const batch = await service.getOldestBatch('JOB-001', 1);
    expect(batch).toHaveLength(1);
    expect(batch[0].jobId).toBe('JOB-001');
  });
});
