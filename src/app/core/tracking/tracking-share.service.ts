import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isPublicTrackingToken } from '../../features/tracking/tracking.model';

export interface IssuedTrackingLink {
  token: string;
  expiresAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class TrackingShareService {
  private readonly http = inject(HttpClient);

  async createPublicLink(jobId: string): Promise<IssuedTrackingLink> {
    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) throw new Error('A job ID is required to create a tracking link.');

    const response = await firstValueFrom(
      this.http.post<unknown>(
        `${environment.apiBaseUrl}/tracking/${encodeURIComponent(normalizedJobId)}/public-token`,
        {}
      )
    );

    if (!this.isIssuedTrackingLink(response)) {
      throw new Error('The tracking API returned an invalid public link token.');
    }

    return response;
  }

  private isIssuedTrackingLink(value: unknown): value is IssuedTrackingLink {
    if (!value || typeof value !== 'object') return false;

    const link = value as Partial<IssuedTrackingLink>;
    return (
      typeof link.token === 'string' &&
      isPublicTrackingToken(link.token) &&
      (link.expiresAt === null ||
        (typeof link.expiresAt === 'string' && !Number.isNaN(Date.parse(link.expiresAt))))
    );
  }
}
