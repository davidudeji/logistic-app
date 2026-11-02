import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  filter,
  firstValueFrom,
  map,
  switchMap,
  timer,
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { TrackingPoint, isTrackingPoint } from '../../features/tracking/tracking.model';
import { environment } from '../../../environments/environment';
import { TrackingTransport } from './tracking-transport';

export type TrackingConnectionState = 'disconnected' | 'connecting' | 'connected' | 'polling';

@Injectable({ providedIn: 'root' })
export class SocketTrackingTransport implements TrackingTransport {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly incomingPositions = new Subject<TrackingPoint>();
  private readonly activeJobs = new Set<string>();
  private readonly pollingSubscriptions = new Map<string, Subscription>();

  readonly connectionState = signal<TrackingConnectionState>('disconnected');
  readonly lastError = signal<string | null>(null);

  private socket: Socket | null = null;

  connect(jobId: string): void {
    if (!jobId.trim()) throw new Error('A job ID is required to connect tracking.');
    if (!this.isBrowser || this.activeJobs.has(jobId)) return;

    this.activeJobs.add(jobId);
    if (!this.socket) {
      this.createSocket();
      return;
    }

    if (this.socket.connected) {
      this.subscribeToJob(jobId);
    } else {
      this.startPollingForActiveJobs();
    }
  }

  positions$(jobId: string): Observable<TrackingPoint> {
    return this.incomingPositions.asObservable().pipe(filter((point) => point.jobId === jobId));
  }

  async sendPosition(jobId: string, point: TrackingPoint): Promise<void> {
    return this.sendPositions(jobId, [point]);
  }

  async sendPositions(jobId: string, points: TrackingPoint[]): Promise<void> {
    if (!points.length || points.some((point) => point.jobId !== jobId || !isTrackingPoint(point))) {
      throw new Error('Every tracking point must be valid and match the requested job.');
    }

    await firstValueFrom(
      this.http.post<void>(`${environment.apiBaseUrl}/tracking/${encodeURIComponent(jobId)}/points`, {
        points,
      })
    );
  }

  disconnect(jobId?: string): void {
    if (jobId) {
      if (!this.activeJobs.delete(jobId)) return;
      this.socket?.emit('tracking:unsubscribe', { jobId });
      this.pollingSubscriptions.get(jobId)?.unsubscribe();
      this.pollingSubscriptions.delete(jobId);
      if (this.activeJobs.size > 0) return;
    } else {
      this.activeJobs.clear();
    }

    this.pollingSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.pollingSubscriptions.clear();
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.connectionState.set('disconnected');
  }

  private createSocket(): void {
    this.connectionState.set('connecting');
    this.lastError.set(null);
    this.socket = io(environment.trackingSocketUrl, {
      autoConnect: false,
      auth: (callback) => callback({ token: this.authService.getToken() }),
      reconnection: true,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
    });

    this.socket.on('connect', () => {
      this.connectionState.set('connected');
      this.lastError.set(null);
      this.pollingSubscriptions.forEach((subscription) => subscription.unsubscribe());
      this.pollingSubscriptions.clear();
      this.activeJobs.forEach((jobId) => this.subscribeToJob(jobId));
    });

    this.socket.on('disconnect', (reason) => {
      this.lastError.set(`Tracking connection disconnected: ${reason}`);
      this.startPollingForActiveJobs();
    });

    this.socket.on('connect_error', (error: Error) => {
      this.lastError.set(error.message);
      this.startPollingForActiveJobs();
    });

    this.socket.on('tracking:position', (payload: unknown) => {
      if (!isTrackingPoint(payload)) {
        this.lastError.set('Received an invalid tracking position from the server.');
        return;
      }

      this.incomingPositions.next(payload);
    });

    this.socket.connect();
  }

  private subscribeToJob(jobId: string): void {
    this.socket?.emit('tracking:subscribe', { jobId });
    this.pollingSubscriptions.get(jobId)?.unsubscribe();
    this.pollingSubscriptions.delete(jobId);
  }

  private startPollingForActiveJobs(): void {
    if (!this.isBrowser || this.socket?.connected) return;
    if (this.activeJobs.size > 0) this.connectionState.set('polling');

    this.activeJobs.forEach((jobId) => {
      if (this.pollingSubscriptions.has(jobId)) return;

      const subscription = timer(0, environment.trackingPollIntervalMs)
        .pipe(
          switchMap(() =>
            this.http
              .get<TrackingPoint[]>(`${environment.apiBaseUrl}/tracking/${encodeURIComponent(jobId)}/history`, {
                params: { limit: '1' },
              })
              .pipe(
                catchError((error: unknown) => {
                  this.lastError.set(
                    error instanceof Error ? error.message : 'Tracking polling request failed.'
                  );
                  return EMPTY;
                })
              )
          ),
          map((points) => {
            if (!Array.isArray(points)) {
              this.lastError.set('Tracking history response is not a list of positions.');
              return undefined;
            }

            const point = points.at(-1);
            if (point && !isTrackingPoint(point)) {
              this.lastError.set('Received an invalid tracking position from polling.');
              return undefined;
            }

            this.lastError.set(null);
            return point;
          }),
          filter((point): point is TrackingPoint => point !== undefined)
        )
        .subscribe((point) => {
          this.connectionState.set('polling');
          this.lastError.set(null);
          this.incomingPositions.next(point);
        });

      this.pollingSubscriptions.set(jobId, subscription);
    });
  }
}
