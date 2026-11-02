import { isTrackingPoint, TrackingPoint } from './tracking.model';

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
