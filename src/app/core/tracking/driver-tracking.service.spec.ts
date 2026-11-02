import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { OfflineTrackingQueueService } from './offline-tracking-queue.service';
import { DriverTrackingService } from './driver-tracking.service';
import { TRACKING_TRANSPORT } from './tracking-transport';

describe('DriverTrackingService', () => {
  let service: DriverTrackingService;
  let geolocation: Geolocation;
  let transport: {
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    sendPosition: ReturnType<typeof vi.fn>;
    sendPositions: ReturnType<typeof vi.fn>;
  };
  let queue: {
    count: ReturnType<typeof vi.fn>;
    enqueue: ReturnType<typeof vi.fn>;
    getOldestBatch: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let originalGeolocation: Geolocation | undefined;

  beforeEach(() => {
    originalGeolocation = navigator.geolocation;
    geolocation = {
      watchPosition: vi.fn(() => 11),
      clearWatch: vi.fn(),
    } as unknown as Geolocation;
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: geolocation,
    });

    transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      sendPosition: vi.fn().mockResolvedValue(undefined),
      sendPositions: vi.fn().mockResolvedValue(undefined),
    };
    queue = {
      count: vi.fn().mockResolvedValue(0),
      enqueue: vi.fn().mockResolvedValue(undefined),
      getOldestBatch: vi.fn().mockResolvedValue([]),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        DriverTrackingService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: TRACKING_TRANSPORT, useValue: transport },
        { provide: OfflineTrackingQueueService, useValue: queue },
      ],
    });
    service = TestBed.inject(DriverTrackingService);
  });

  afterEach(() => {
    service.stopTracking();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    });
    vi.restoreAllMocks();
  });

  it('starts high-accuracy location watching for the selected job', async () => {
    await service.startTrip('JOB-001');

    expect(transport.connect).toHaveBeenCalledWith('JOB-001');
    expect(geolocation.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
    expect(service.tripStatus()).toBe('in_transit');
  });

  it('ignores a GPS fix with accuracy worse than 100 meters', async () => {
    await service.startTrip('JOB-001');
    const success = vi.mocked(geolocation.watchPosition).mock.calls[0][0];
    success({
      coords: {
        latitude: 6.5244,
        longitude: 3.3792,
        accuracy: 101,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: Date.now(),
      toJSON: () => ({}),
    });

    expect(service.gpsSignal()).toBe('poor');
    expect(queue.enqueue).not.toHaveBeenCalled();
  });

  it('shows permission help when the driver denies location access', async () => {
    await service.startTrip('JOB-001');
    const error = vi.mocked(geolocation.watchPosition).mock.calls[0][1];
    if (!error) throw new Error('Expected the GPS error callback to be registered.');
    error({
      code: 1,
      message: 'Permission denied',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });

    expect(service.gpsSignal()).toBe('denied');
    expect(service.errorMessage()).toContain('Allow location access');
    expect(transport.disconnect).toHaveBeenCalled();
  });

  it('flushes saved points as an ordered batch after GPS starts online', async () => {
    const first = {
      id: 1,
      jobId: 'JOB-001',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: 0,
      heading: null,
      timestamp: '2026-11-02T00:00:00.000Z',
    };
    const second = { ...first, id: 2, timestamp: '2026-11-02T00:00:10.000Z' };
    queue.getOldestBatch
      .mockResolvedValueOnce([first, second])
      .mockResolvedValueOnce([]);

    await service.startTrip('JOB-001');

    expect(transport.sendPositions).toHaveBeenCalledWith('JOB-001', [
      expect.objectContaining({ timestamp: first.timestamp }),
      expect.objectContaining({ timestamp: second.timestamp }),
    ]);
    expect(queue.remove).toHaveBeenCalledWith([1, 2]);
  });
});
