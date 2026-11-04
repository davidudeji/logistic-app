import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SocketTrackingTransport } from './socket-tracking-transport.service';

describe('SocketTrackingTransport', () => {
  let service: SocketTrackingTransport;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        SocketTrackingTransport,
      ],
    });
    service = TestBed.inject(SocketTrackingTransport);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('posts positions as a batch for the requested job', async () => {
    const point = {
      jobId: 'JOB-001',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: 5,
      heading: 90,
      timestamp: '2026-11-02T00:00:00.000Z',
    };

    const send = service.sendPosition(point.jobId, point);
    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/v1/tracking/JOB-001/points'
    );

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ points: [point] });
    request.flush({ accepted: 1 });
    await expect(send).resolves.toBeUndefined();
  });

  it('rejects points for a different job before making a request', async () => {
    const point = {
      jobId: 'JOB-002',
      lat: 6.5244,
      lng: 3.3792,
      accuracy: 10,
      speed: null,
      heading: null,
      timestamp: '2026-11-02T00:00:00.000Z',
    };

    await expect(service.sendPosition('JOB-001', point)).rejects.toThrow(
      'Every tracking point must be valid and match the requested job.'
    );
    httpTestingController.expectNone(
      'http://localhost:5000/api/v1/tracking/JOB-001/points'
    );
  });
});
