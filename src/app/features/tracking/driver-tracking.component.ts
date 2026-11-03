import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DriverTrackingService, GpsSignalState, TripStatus } from '../../core/tracking/driver-tracking.service';

@Component({
  selector: 'app-driver-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Driver trip</h1>
          <span class="header-subtitle">Job {{ jobId }}</span>
        </div>
      </div>
    </header>

    <main class="driver-tracking-page">
      <section class="trip-card" aria-labelledby="trip-status-title">
        <div class="trip-card-header">
          <div>
            <p class="eyebrow">Current status</p>
            <h2 id="trip-status-title">{{ statusLabel(tracking.tripStatus()) }}</h2>
          </div>
          <div
            class="gps-indicator"
            [attr.data-state]="tracking.gpsSignal()"
            role="status"
            aria-live="polite"
          >
            <span class="gps-indicator-dot"></span>
            GPS {{ gpsLabel(tracking.gpsSignal()) }}
          </div>
        </div>

        <p class="keep-screen-open">Keep this screen open while delivering.</p>
        @if (tracking.wakeLockMessage()) {
          <p class="notice">{{ tracking.wakeLockMessage() }}</p>
        }

        <div class="trip-actions">
          <button
            class="btn btn-primary"
            type="button"
            [disabled]="tracking.tripStatus() === 'delivered'"
            (click)="startTrip()"
          >
            Start trip
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            [disabled]="tracking.tripStatus() !== 'in_transit'"
            (click)="tracking.markArrived()"
          >
            Arrived
          </button>
          <button
            class="btn btn-secondary"
            type="button"
            [disabled]="tracking.tripStatus() !== 'arrived'"
            (click)="markDelivered()"
          >
            Delivered
          </button>
        </div>

        @if (tracking.gpsSignal() === 'denied') {
          <div class="permission-help" role="alert">
            Location permission is off. Allow location access for this site in your browser
            settings, then reload this page and start the trip again.
          </div>
        }

        @if (tracking.errorMessage()) {
          <div class="error-message" role="alert">{{ tracking.errorMessage() }}</div>
        }

        <div class="sync-status" [attr.data-state]="tracking.syncState()">
          @switch (tracking.syncState()) {
            @case ('syncing') { Uploading saved GPS points… }
            @case ('offline') { Offline — {{ tracking.pendingCount() }} point(s) saved for sync. }
            @case ('error') { GPS points are saved locally; upload will retry when possible. }
            @default { {{ tracking.pendingCount() }} point(s) waiting to sync. }
          }
        </div>

        @if (tracking.lastPoint(); as point) {
          <dl class="last-position">
            <div><dt>Last GPS fix</dt><dd>{{ point.timestamp | date:'mediumTime' }}</dd></div>
            <div><dt>Accuracy</dt><dd>{{ point.accuracy | number:'1.0-0' }} m</dd></div>
            @if (point.speed !== null) {
              <div><dt>Speed</dt><dd>{{ point.speed | number:'1.0-1' }} km/h</dd></div>
            }
          </dl>
        }
      </section>
    </main>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100%; }

    .driver-tracking-page {
      display: grid;
      place-items: start center;
      padding: 24px;
    }

    .trip-card {
      width: min(100%, 620px);
      padding: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
    }

    .trip-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }

    .eyebrow {
      margin: 0 0 6px;
      color: #64748b;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    h2 { margin: 0; font-size: 24px; }

    .gps-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      color: #475569;
      font-size: 13px;
      white-space: nowrap;
    }

    .gps-indicator-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #94a3b8;
    }

    .gps-indicator[data-state="good"] .gps-indicator-dot { background: #16a34a; }
    .gps-indicator[data-state="poor"] .gps-indicator-dot,
    .gps-indicator[data-state="acquiring"] .gps-indicator-dot { background: #f59e0b; }
    .gps-indicator[data-state="denied"] .gps-indicator-dot,
    .gps-indicator[data-state="error"] .gps-indicator-dot { background: #dc2626; }

    .keep-screen-open {
      margin: 22px 0;
      padding: 14px;
      border-left: 4px solid #2563eb;
      background: #eff6ff;
      color: #1e3a8a;
      font-weight: 600;
    }

    .notice, .permission-help, .error-message, .sync-status {
      margin: 12px 0;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
    }

    .notice { background: #f8fafc; color: #475569; }
    .permission-help, .error-message { background: #fef2f2; color: #991b1b; }
    .sync-status { background: #f1f5f9; color: #334155; }
    .sync-status[data-state="offline"] { background: #fff7ed; color: #9a3412; }
    .sync-status[data-state="error"] { background: #fef2f2; color: #991b1b; }

    .trip-actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      margin: 20px 0;
    }

    .trip-actions button { min-height: 48px; }
    .trip-actions button:disabled { cursor: not-allowed; opacity: .48; }

    .last-position {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin: 20px 0 0;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .last-position div { display: grid; gap: 4px; }
    .last-position dt { color: #64748b; font-size: 12px; }
    .last-position dd { margin: 0; font-weight: 600; }

    @media (max-width: 540px) {
      .driver-tracking-page { padding: 12px; }
      .trip-card { padding: 18px; }
      .trip-card-header { flex-direction: column; }
      .trip-actions { grid-template-columns: 1fr; }
    }
  `],
})
export class DriverTrackingComponent implements OnDestroy {
  readonly tracking = inject(DriverTrackingService);
  readonly jobId = inject(ActivatedRoute).snapshot.paramMap.get('jobId') ?? '';

  startTrip(): void {
    void this.tracking.startTrip(this.jobId);
  }

  markDelivered(): void {
    void this.tracking.markDelivered();
  }

  ngOnDestroy(): void {
    if (this.tracking.tripStatus() !== 'delivered') this.tracking.stopTracking();
  }

  gpsLabel(state: GpsSignalState): string {
    return {
      unknown: 'not started',
      acquiring: 'acquiring',
      good: 'good',
      poor: 'weak',
      denied: 'permission denied',
      unsupported: 'unavailable',
      error: 'error',
    }[state];
  }

  statusLabel(status: TripStatus): string {
    return {
      not_started: 'Not started',
      in_transit: 'In transit',
      arrived: 'Arrived',
      delivered: 'Delivered',
    }[status];
  }
}
