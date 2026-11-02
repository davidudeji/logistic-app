import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TrackingShareService } from './tracking-share.service';

describe('TrackingShareService', () => {
  let service: TrackingShareService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrackingShareService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TrackingShareService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('requests a server-issued public token scoped to one job', async () => {
    const createLink = service.createPublicLink('JOB-001');
    const request = httpTestingController.expectOne(
      'http://localhost:5000/api/v1/tracking/JOB-001/public-token'
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});

    const response = { token: 'a'.repeat(43), expiresAt: null };
    request.flush(response);
    await expect(createLink).resolves.toEqual(response);
  });

  it('rejects a token that does not meet the unguessable-token contract', async () => {
    const createLink = service.createPublicLink('JOB-001');
    httpTestingController
      .expectOne('http://localhost:5000/api/v1/tracking/JOB-001/public-token')
      .flush({ token: 'short', expiresAt: null });

    await expect(createLink).rejects.toThrow('invalid public link token');
  });
});
