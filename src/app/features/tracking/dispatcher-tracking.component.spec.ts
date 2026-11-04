import { PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DispatcherTrackingService } from '../../core/tracking/dispatcher-tracking.service';
import { DispatcherTrackingComponent } from './dispatcher-tracking.component';
import { ActiveTrackingJob, TrackingPoint } from './tracking.model';

describe('DispatcherTrackingComponent', () => {
  let component: DispatcherTrackingComponent;
  const tracking = {
    activeJobs: signal<ActiveTrackingJob[]>([]),
    isLoading: signal(false),
    errorMessage: signal<string | null>(null),
    history: signal<TrackingPoint[]>([]),
    historyJobId: signal<string | null>(null),
    historyLoading: signal(false),
    historyError: signal<string | null>(null),
    refreshActiveJobs: vi.fn(),
    loadHistory: vi.fn(),
    disconnect: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DispatcherTrackingService, useValue: tracking },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });
    component = TestBed.runInInjectionContext(() => new DispatcherTrackingComponent());
  });

  afterEach(() => component.ngOnDestroy());

  it('marks a vehicle stale at two minutes and reports seconds since its last update', () => {
    const now = Date.parse('2026-11-02T00:02:00.000Z');
    const point: TrackingPoint = {
      jobId: 'JOB-001',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: null,
      heading: null,
      timestamp: '2026-11-02T00:00:00.000Z',
    };
    const job: ActiveTrackingJob = {
      jobId: point.jobId,
      vehicleId: 'VEH-001',
      vehicleRegistration: 'ABC-123',
      driverFirstName: 'Ada',
      status: 'in_transit',
      latestPosition: point,
    };

    component.currentTime.set(now - 1);
    expect(component.isStale(job)).toBe(false);
    component.currentTime.set(now);
    expect(component.isStale(job)).toBe(true);
    expect(component.displayStatus(job)).toBe('Stale');
    expect(component.lastSeen(point)).toBe('Last seen 120 seconds ago');
  });
});
