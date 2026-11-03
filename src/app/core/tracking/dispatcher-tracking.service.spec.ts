import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { DispatcherTrackingService } from './dispatcher-tracking.service';
import { TRACKING_TRANSPORT } from './tracking-transport';
import { ActiveTrackingJob, TrackingPoint } from '../../features/tracking/tracking.model';

describe('DispatcherTrackingService', () => {
  let service: DispatcherTrackingService;
  let httpTestingController: HttpTestingController;
  let positionSubject: Subject<TrackingPoint>;
  let transport: {
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
    positions$: ReturnType<typeof vi.fn>;
    sendPosition: ReturnType<typeof vi.fn>;
  };

  const job: ActiveTrackingJob = {
    jobId: 'JOB-001',
    vehicleId: 'VEH-001',
    vehicleRegistration: 'ABC-123',
    driverFirstName: 'Ada',
    status: 'in_transit',
    latestPosition: null,
  };

  const point: TrackingPoint = {
    jobId: 'JOB-001',
    lat: 6.5244,
    lng: 3.3792,
    accuracy: 10,
    speed: 5,
    heading: 90,
    timestamp: '2026-11-02T00:00:00.000Z',
  };

  beforeEach(() => {
    positionSubject = new Subject<TrackingPoint>();
    transport = {
      connect: vi.fn(),
      disconnect: vi.fn(),
      positions$: vi.fn(() => positionSubject.asObservable()),
      sendPosition: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [
        DispatcherTrackingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TRACKING_TRANSPORT, useValue: transport },
      ],
    });

    service = TestBed.inject(DispatcherTrackingService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    service.disconnect();
    httpTestingController.verify();
  });

  it('loads active jobs and updates their positions from the live transport', () => {
    service.refreshActiveJobs();
    httpTestingController
      .expectOne('http://localhost:5000/api/v1/tracking/active')
      .flush([job]);

    expect(service.activeJobs()).toEqual([job]);
    expect(transport.connect).toHaveBeenCalledWith(job.jobId);

    positionSubject.next(point);
    expect(service.activeJobs()[0].latestPosition).toEqual(point);
  });

  it('disconnects jobs that are no longer active', () => {
    service.refreshActiveJobs();
    httpTestingController
      .expectOne('http://localhost:5000/api/v1/tracking/active')
      .flush([job]);

    service.refreshActiveJobs();
    httpTestingController
      .expectOne('http://localhost:5000/api/v1/tracking/active')
      .flush([]);

    expect(service.activeJobs()).toEqual([]);
    expect(transport.disconnect).toHaveBeenCalledWith(job.jobId);
  });

  it('ignores a pending active-jobs response after disconnecting', () => {
    service.refreshActiveJobs();
    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/v1/tracking/active'
    );

    service.disconnect();
    request.flush([job]);

    expect(service.activeJobs()).toEqual([]);
    expect(service.isLoading()).toBe(false);
    expect(transport.connect).not.toHaveBeenCalled();
  });

  it('sorts a completed job history chronologically for replay', () => {
    const earlier = { ...point, timestamp: '2026-11-01T23:59:50.000Z' };
    service.loadHistory(job.jobId);
    httpTestingController
      .expectOne('http://localhost:5000/api/v1/tracking/JOB-001/history')
      .flush([point, earlier]);

    expect(service.history()).toEqual([earlier, point]);
    expect(service.historyJobId()).toBe(job.jobId);
  });

  it('clears an existing replay when the job ID is blank', () => {
    service.history.set([point]);
    service.historyJobId.set(job.jobId);

    service.loadHistory('  ');

    expect(service.history()).toEqual([]);
    expect(service.historyJobId()).toBeNull();
    expect(service.historyError()).toBe('Enter a job ID to load its trip history.');
    httpTestingController.expectNone((request) => request.url.includes('/history'));
  });
});
