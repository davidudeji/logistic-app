import {
  isPublicTrackingSnapshot,
  isPublicTrackingToken,
  isTrackingPoint,
  PublicTrackingSnapshot,
  TrackingPoint,
} from './tracking.model';

describe('isTrackingPoint', () => {
  const validPoint: TrackingPoint = {
    jobId: 'JOB-001',
    lat: 6.5244,
    lng: 3.3792,
    accuracy: 10,
    speed: 5,
    heading: 90,
    timestamp: '2026-11-02T00:00:00.000Z',
  };

  it('accepts a valid location point', () => {
    expect(isTrackingPoint(validPoint)).toBe(true);
  });

  it('rejects invalid coordinates and timestamps', () => {
    expect(isTrackingPoint({ ...validPoint, lat: 91 })).toBe(false);
    expect(isTrackingPoint({ ...validPoint, lng: Number.NaN })).toBe(false);
    expect(isTrackingPoint({ ...validPoint, timestamp: 'not-a-date' })).toBe(false);
    expect(isTrackingPoint({ ...validPoint, speed: -1 })).toBe(false);
    expect(isTrackingPoint({ ...validPoint, heading: 361 })).toBe(false);
  });
});

describe('public tracking response validation', () => {
  const snapshot: PublicTrackingSnapshot = {
    driverFirstName: 'Ada',
    driverPhone: '+234 800 000 0000',
    vehicleRegistration: 'ABC-123',
    status: 'in_transit',
    position: { lat: 6.5244, lng: 3.3792 },
    lastUpdatedAt: '2026-11-02T00:00:00.000Z',
    eta: null,
  };

  it('accepts a scoped public snapshot and a 256-bit URL-safe token', () => {
    expect(isPublicTrackingSnapshot(snapshot)).toBe(true);
    expect(isPublicTrackingToken('a'.repeat(43))).toBe(true);
  });

  it('rejects malformed or overexposed public tracking responses', () => {
    expect(isPublicTrackingSnapshot({ ...snapshot, driver: { email: 'private@example.test' } })).toBe(false);
    expect(isPublicTrackingSnapshot({ ...snapshot, position: { lat: 6.5, lng: 3.3, jobId: 'JOB-001' } })).toBe(false);
    expect(isPublicTrackingSnapshot({ ...snapshot, driverPhone: 'javascript:alert(1)' })).toBe(false);
    expect(isPublicTrackingToken('short')).toBe(false);
  });
});
