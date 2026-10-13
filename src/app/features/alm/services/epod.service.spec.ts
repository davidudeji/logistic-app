import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { EpodService } from './epod.service';
import { AlmApiService } from '../data-access/alm-api.service';

describe('EpodService', () => {
  let service: EpodService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), EpodService, AlmApiService],
    });
    service = TestBed.inject(EpodService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should accept valid JPEG and PNG files within 10MB', () => {
    const validFile = new File(['mock_image_bytes'], 'receipt.jpg', { type: 'image/jpeg' });
    const result = service.validateImageFile(validFile);
    expect(result.valid).toBe(true);
  });

  it('should reject non-image file types', () => {
    const invalidFile = new File(['text'], 'report.pdf', { type: 'application/pdf' });
    const result = service.validateImageFile(invalidFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unsupported file format');
  });

  it('should reject files exceeding 10 MB limit', () => {
    // Mock file larger than 10MB
    const bigFile = {
      name: 'large.png',
      type: 'image/png',
      size: 15 * 1024 * 1024,
    } as unknown as File;

    const result = service.validateImageFile(bigFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('10 MB limit');
  });
});
