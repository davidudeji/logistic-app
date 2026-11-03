import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackingPoint } from '../../features/tracking/tracking.model';

export interface TrackingTransportError {
  jobId: string;
  message: string;
}

export interface TrackingTransport {
  connect(jobId: string): void;
  positions$(jobId: string): Observable<TrackingPoint>;
  errors$?: Observable<TrackingTransportError>;
  sendPosition(jobId: string, point: TrackingPoint): Promise<void>;
  sendPositions?(jobId: string, points: TrackingPoint[]): Promise<void>;
  disconnect(jobId?: string): void;
}

export const TRACKING_TRANSPORT = new InjectionToken<TrackingTransport>('TRACKING_TRANSPORT');
