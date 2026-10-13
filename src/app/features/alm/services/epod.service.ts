import { Injectable, inject, signal } from '@angular/core';
import { AlmApiService } from '../data-access/alm-api.service';
import { EpodSubmissionResponse, EpodUploadPayload } from '../models/epod-audit.model';
import { Observable, tap } from 'rxjs';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable({ providedIn: 'root' })
export class EpodService {
  private readonly apiService = inject(AlmApiService);

  readonly currentSubmission = signal<EpodSubmissionResponse | null>(null);
  readonly isUploading = signal<boolean>(false);
  readonly uploadError = signal<string | null>(null);

  validateImageFile(file: File): { valid: boolean; error?: string } {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file format (${file.type}). Please select a JPEG, PNG, or WebP image.`,
      };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size exceeds the 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      };
    }

    return { valid: true };
  }

  submitEpod(deliveryId: string, payload: EpodUploadPayload): Observable<EpodSubmissionResponse> {
    const formData = new FormData();
    formData.append('image', payload.image);
    if (payload.receiverName) formData.append('receiverName', payload.receiverName);
    if (payload.deliveryNotes) formData.append('deliveryNotes', payload.deliveryNotes);
    formData.append('capturedAt', payload.capturedAt);
    formData.append('clientMutationId', payload.clientMutationId);

    this.isUploading.set(true);
    this.uploadError.set(null);

    return this.apiService.uploadEpod(deliveryId, formData).pipe(
      tap({
        next: (response) => {
          this.isUploading.set(false);
          this.currentSubmission.set(response);
        },
        error: (err) => {
          this.isUploading.set(false);
          this.uploadError.set(err.message || 'Failed to upload proof of delivery.');
        },
      })
    );
  }

  updateAuditStatus(
    deliveryId: string,
    status: 'approved' | 'review_required' | 'rejected',
    reviewerName: string
  ): void {
    const current = this.currentSubmission();
    if (current && current.deliveryId === deliveryId) {
      this.currentSubmission.set({
        ...current,
        status,
        reviewedBy: reviewerName,
        reviewedAt: new Date().toISOString(),
      });
    }
  }

  getDownloadUrl(epodId: string): Observable<{ downloadUrl: string; expiresAt: string }> {
    return this.apiService.getEpodDownloadUrl(epodId);
  }
}
