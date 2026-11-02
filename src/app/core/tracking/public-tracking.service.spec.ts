import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PublicTrackingService } from './public-tracking.service';

describe('PublicTrackingService', () => {
  let service: PublicTrackingService;
  let httpTestingController: HttpTestingController;
  const token = 'a'.repeat(43);

  const snapshot = {
    driverFirstName: 'Ada',
    driverPhone: '+234 800 000 0000',
    vehicleRegistration: 'ABC-123',
    status: 'in_transit',
    position: { lat: 6.5244, lng: 3.3792 },
    lastUpdatedAt: '2026-11-02T00:00:00.000Z',
    eta: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PublicTrackingService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PublicTrackingService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads the limited public snapshot without requiring an authenticated request', () => {
    service.load(token);
    const request = httpTestingController.expectOne(
      `http://localhost:5000/api/v1/tracking/public/${token}`
    );

    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush(snapshot);

    expect(service.snapshot()).toEqual(snapshot);
    expect(service.errorMessage()).toBeNull();
  });

  it('stops exposing a snapshot after the public token expires', () => {
    service.load(token);
    httpTestingController
      .expectOne(`http://localhost:5000/api/v1/tracking/public/${token}`)
      .flush({ error: 'expired' }, { status: 410, statusText: 'Gone' });

    expect(service.snapshot()).toBeNull();
    expect(service.isExpired()).toBe(true);
    expect(service.errorMessage()).toContain('invalid or has expired');
  });

  it('rejects malformed tokens before making a request', () => {
    service.load('not-a-secure-token');

    expect(service.isExpired()).toBe(true);
    expect(service.errorMessage()).toContain('invalid or has expired');
    httpTestingController.expectNone((request) => request.url.includes('/tracking/public/'));
  });
});
