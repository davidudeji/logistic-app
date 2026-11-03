import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  PublicTrackingSnapshot,
  isPublicTrackingSnapshot,
  isPublicTrackingToken,
} from '../../features/tracking/tracking.model';

@Injectable({ providedIn: 'root' })
export class PublicTrackingService {
  private readonly http = inject(HttpClient);
  private requestId = 0;
  private currentToken: string | null = null;

  readonly snapshot = signal<PublicTrackingSnapshot | null>(null);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly isExpired = signal(false);

  load(token: string): void {
    if (token !== this.currentToken) {
      this.currentToken = token;
      this.snapshot.set(null);
      this.errorMessage.set(null);
      this.isExpired.set(false);
    }

    const requestId = ++this.requestId;
    if (!isPublicTrackingToken(token)) {
      this.snapshot.set(null);
      this.errorMessage.set('This tracking link is invalid or has expired.');
      this.isExpired.set(true);
      this.isLoading.set(false);
      return;
    }
    if (this.isExpired()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.http
      .get<unknown>(
        `${environment.apiBaseUrl}/tracking/public/${encodeURIComponent(token)}`
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.requestId) return;
          if (!isPublicTrackingSnapshot(response)) {
            this.snapshot.set(null);
            this.errorMessage.set('The tracking service returned invalid delivery details.');
            this.isLoading.set(false);
            return;
          }

          this.snapshot.set(response);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          if (requestId !== this.requestId) return;
          if (error instanceof HttpErrorResponse && [404, 410].includes(error.status)) {
            this.snapshot.set(null);
            this.errorMessage.set('This tracking link is invalid or has expired.');
            this.isExpired.set(true);
          } else {
            this.errorMessage.set(
              error instanceof Error ? error.message : 'Could not load delivery tracking.'
            );
          }
          this.isLoading.set(false);
        },
      });
  }

  disconnect(): void {
    this.requestId++;
    this.isLoading.set(false);
  }
}
