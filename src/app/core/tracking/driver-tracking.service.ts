import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { TrackingPoint } from '../../features/tracking/tracking.model';
import { TRACKING_TRANSPORT } from './tracking-transport';
import { OfflineTrackingQueueService } from './offline-tracking-queue.service';

export type TripStatus = 'not_started' | 'in_transit' | 'arrived' | 'delivered';
export type GpsSignalState = 'unknown' | 'acquiring' | 'good' | 'poor' | 'denied' | 'unsupported' | 'error';
export type TrackingSyncState = 'idle' | 'syncing' | 'offline' | 'error';

const MINIMUM_ACCURACY_METERS = 100;
const MOVING_UPDATE_INTERVAL_MS = 10_000;
const STATIONARY_UPDATE_INTERVAL_MS = 60_000;
const STATIONARY_SPEED_METERS_PER_SECOND = 0.5;
const MAX_BATCH_SIZE = 100;

@Injectable({ providedIn: 'root' })
export class DriverTrackingService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly transport = inject(TRACKING_TRANSPORT);
  private readonly offlineQueue = inject(OfflineTrackingQueueService);

  readonly tripStatus = signal<TripStatus>('not_started');
  readonly gpsSignal = signal<GpsSignalState>('unknown');
  readonly syncState = signal<TrackingSyncState>('idle');
  readonly lastPoint = signal<TrackingPoint | null>(null);
  readonly pendingCount = signal(0);
  readonly errorMessage = signal<string | null>(null);
  readonly wakeLockAvailable = signal(false);
  readonly wakeLockMessage = signal<string | null>(null);

  private activeJobId: string | null = null;
  private watchId: number | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private lastQueuedAt = 0;
  private starting = false;
  private startAttempt = 0;
  private flushPromise: Promise<void> | null = null;

  private readonly onlineListener = (): void => {
    if (this.activeJobId) void this.flushQueue(this.activeJobId);
  };
  private readonly visibilityListener = (): void => {
    if (
      document.visibilityState === 'visible' &&
      this.activeJobId &&
      this.tripStatus() !== 'delivered'
    ) {
      void this.requestWakeLock();
    }
  };

  async startTrip(jobId: string): Promise<void> {
    if (!jobId.trim()) {
      this.errorMessage.set('A job ID is required to start a trip.');
      return;
    }
    if (!this.isBrowser) {
      this.gpsSignal.set('unsupported');
      this.errorMessage.set('GPS tracking is only available in a browser.');
      return;
    }
    if (!navigator.geolocation) {
      this.gpsSignal.set('unsupported');
      this.errorMessage.set('This browser does not support location access.');
      return;
    }
    if (this.tripStatus() === 'delivered') {
      this.errorMessage.set('This trip has already been delivered.');
      return;
    }
    if (this.watchId !== null || this.starting) return;

    const attempt = ++this.startAttempt;
    this.starting = true;
    this.activeJobId = jobId;
    this.lastQueuedAt = 0;
    this.errorMessage.set(null);
    this.gpsSignal.set('acquiring');

    try {
      this.transport.connect(jobId);
      await this.refreshPendingCount(jobId);
      if (attempt !== this.startAttempt) return;

      this.tripStatus.set('in_transit');
      window.addEventListener('online', this.onlineListener);
      document.addEventListener('visibilitychange', this.visibilityListener);
      void this.requestWakeLock();
      this.watchId = navigator.geolocation.watchPosition(
        (position) => void this.handlePosition(position),
        (error) => this.handleLocationError(error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
      );
      if (navigator.onLine) await this.flushQueue(jobId);
      else this.syncState.set('offline');
    } catch (error) {
      if (attempt !== this.startAttempt) return;
      this.gpsSignal.set('error');
      this.errorMessage.set(this.describeError(error, 'Could not start GPS tracking.'));
      this.stopTracking();
      this.tripStatus.set('not_started');
    } finally {
      if (attempt === this.startAttempt) this.starting = false;
    }
  }

  markArrived(): void {
    if (this.tripStatus() !== 'in_transit') return;
    this.tripStatus.set('arrived');
  }

  async markDelivered(): Promise<void> {
    if (this.tripStatus() !== 'arrived') return;

    this.tripStatus.set('delivered');
    this.stopGpsCapture();
    if (this.activeJobId && this.isBrowser && navigator.onLine) {
      await this.flushQueue(this.activeJobId);
    } else if (this.pendingCount() > 0) {
      this.syncState.set('offline');
    }

    if (this.pendingCount() === 0) this.stopTracking();
  }

  stopTracking(): void {
    this.startAttempt++;
    this.starting = false;
    this.stopGpsCapture();
    this.activeJobId = null;

    if (this.isBrowser) {
      window.removeEventListener('online', this.onlineListener);
      document.removeEventListener('visibilitychange', this.visibilityListener);
    }

    this.transport.disconnect();
  }

  private stopGpsCapture(): void {
    if (this.watchId !== null && this.isBrowser && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;

    const wakeLock = this.wakeLock;
    this.wakeLock = null;
    this.wakeLockAvailable.set(false);
    if (wakeLock) {
      void wakeLock.release().catch((error: unknown) => {
        this.errorMessage.set(this.describeError(error, 'Could not release the screen wake lock.'));
      });
    }
  }

  private async handlePosition(position: GeolocationPosition): Promise<void> {
    const jobId = this.activeJobId;
    if (!jobId || !['in_transit', 'arrived'].includes(this.tripStatus())) return;

    const { latitude, longitude, accuracy, speed, heading } = position.coords;
    if (!Number.isFinite(accuracy) || accuracy > MINIMUM_ACCURACY_METERS) {
      this.gpsSignal.set('poor');
      return;
    }

    const now = Date.now();
    const updateInterval =
      speed === null || speed < STATIONARY_SPEED_METERS_PER_SECOND
        ? STATIONARY_UPDATE_INTERVAL_MS
        : MOVING_UPDATE_INTERVAL_MS;
    if (now - this.lastQueuedAt < updateInterval) return;

    this.lastQueuedAt = now;
    const point: TrackingPoint = {
      jobId,
      lat: latitude,
      lng: longitude,
      accuracy,
      speed: speed === null ? null : Math.round(speed * 36) / 10,
      heading,
      timestamp: new Date(position.timestamp).toISOString(),
    };

    this.lastPoint.set(point);
    this.gpsSignal.set('good');

    try {
      await this.offlineQueue.enqueue(point);
      await this.refreshPendingCount(jobId);
      if (navigator.onLine) await this.flushQueue(jobId);
      else this.syncState.set('offline');
    } catch (error) {
      this.syncState.set('error');
      this.errorMessage.set(this.describeError(error, 'Could not save this GPS point offline.'));
      this.gpsSignal.set('error');
      this.stopTracking();
    }
  }

  private handleLocationError(error: GeolocationPositionError): void {
    if (error.code === error.PERMISSION_DENIED) {
      this.stopTracking();
      this.gpsSignal.set('denied');
      this.errorMessage.set(
        'Location permission was denied. Allow location access in your browser settings, then reload this page.'
      );
      return;
    }

    this.gpsSignal.set(error.code === error.POSITION_UNAVAILABLE ? 'poor' : 'error');
    this.errorMessage.set(error.message || 'The browser could not read a GPS position.');
  }

  private async flushQueue(jobId: string): Promise<void> {
    if (!this.isBrowser || !navigator.onLine) {
      this.syncState.set('offline');
      return;
    }
    if (this.flushPromise) return this.flushPromise;

    this.flushPromise = this.flushQueuedPoints(jobId).finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  private async flushQueuedPoints(jobId: string): Promise<void> {
    this.syncState.set('syncing');
    this.errorMessage.set(null);

    try {
      while (navigator.onLine) {
        const batch = await this.offlineQueue.getOldestBatch(jobId, MAX_BATCH_SIZE);
        if (!batch.length) break;

        const points = batch.map(({ id: _id, ...point }) => point);
        if (this.transport.sendPositions) {
          await this.transport.sendPositions(jobId, points);
        } else {
          for (const point of points) {
            await this.transport.sendPosition(jobId, point);
          }
        }

        await this.offlineQueue.remove(batch.map((point) => point.id));
        await this.refreshPendingCount(jobId);
      }

      this.syncState.set(navigator.onLine ? 'idle' : 'offline');
      if (this.tripStatus() === 'delivered' && this.pendingCount() === 0) {
        this.stopTracking();
      }
    } catch (error) {
      this.syncState.set('error');
      this.errorMessage.set(this.describeError(error, 'Could not upload queued GPS points.'));
    }
  }

  private async refreshPendingCount(jobId: string): Promise<void> {
    this.pendingCount.set(await this.offlineQueue.count(jobId));
  }

  private async requestWakeLock(): Promise<void> {
    if (!this.isBrowser) return;
    if (!navigator.wakeLock) {
      this.wakeLockMessage.set('Screen wake lock is unavailable; keep this screen open while delivering.');
      return;
    }

    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      if (!this.activeJobId || this.tripStatus() === 'delivered') {
        await wakeLock.release();
        return;
      }

      this.wakeLock = wakeLock;
      this.wakeLockAvailable.set(true);
      this.wakeLockMessage.set(null);
      this.wakeLock.addEventListener('release', () => this.wakeLockAvailable.set(false), {
        once: true,
      });
    } catch {
      this.wakeLockAvailable.set(false);
      this.wakeLockMessage.set('Screen wake lock could not be enabled; keep this screen open while delivering.');
    }
  }

  private describeError(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}
