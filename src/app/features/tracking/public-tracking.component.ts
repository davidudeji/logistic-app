import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, distinctUntilChanged, map } from 'rxjs';
import { PublicTrackingService } from '../../core/tracking/public-tracking.service';
import { TrackingMapComponent } from './tracking-map.component';
import { TrackingMapMarker } from './tracking.model';

const REFRESH_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-public-tracking',
  standalone: true,
  imports: [CommonModule, TrackingMapComponent],
  template: `
    <main class="public-page">
      <header class="page-header">
        <div class="brand-mark" aria-hidden="true">N</div>
        <div>
          <p class="eyebrow">NexusOps delivery updates</p>
          <h1>Track your delivery</h1>
        </div>
      </header>

      @if (tracking.errorMessage()) {
        <section class="message-card error-card" role="alert">
          <h2>Tracking unavailable</h2>
          <p>{{ tracking.errorMessage() }}</p>
        </section>
      }

      @if (tracking.isLoading() && !tracking.snapshot()) {
        <section class="message-card" aria-live="polite">
          <span class="loading-indicator"></span>
          <p>Loading your delivery updates…</p>
        </section>
      }

      @if (tracking.snapshot(); as delivery) {
        <section class="delivery-card" aria-label="Delivery details">
          <div class="delivery-card-heading">
            <div>
              <p class="eyebrow">Current status</p>
              <h2>{{ delivery.status.replace('_', ' ') }}</h2>
            </div>
            <span class="status-pulse" aria-hidden="true"></span>
          </div>

          <div class="details-grid">
            <div>
              <span class="detail-label">Driver</span>
              <strong>{{ delivery.driverFirstName }}</strong>
            </div>
            <div>
              <span class="detail-label">Vehicle</span>
              <strong>{{ delivery.vehicleRegistration }}</strong>
            </div>
            <div class="last-update">
              <span class="detail-label">Last update</span>
              <strong>
                @if (delivery.lastUpdatedAt) {
                  {{ delivery.lastUpdatedAt | date:'medium' }}
                } @else {
                  Waiting for the first location update
                }
              </strong>
            </div>
          </div>

          <a class="call-driver" [href]="'tel:' + delivery.driverPhone">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.84.58 2.8.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Call driver
          </a>
        </section>

        <section class="map-card" aria-label="Delivery location">
          <app-tracking-map
            [markers]="markers()"
            [center]="center()"
            [zoom]="zoom()"
          ></app-tracking-map>
          @if (!delivery.position) {
            <div class="map-empty">The driver's location will appear here when available.</div>
          }
          <div class="map-attribution">Map data © OpenStreetMap contributors</div>
        </section>
      }

      <footer class="page-footer">
        Location updates refresh automatically. This link only shows this delivery.
      </footer>
    </main>
  `,
  styles: [`
    :host { display: block; min-height: 100%; background: #f1f5f9; }

    .public-page {
      display: grid;
      gap: 14px;
      width: min(100%, 720px);
      margin: 0 auto;
      padding: 18px 14px 28px;
    }

    .page-header { display: flex; align-items: center; gap: 12px; padding: 4px 2px; }
    .brand-mark {
      display: grid;
      width: 42px;
      height: 42px;
      place-items: center;
      border-radius: 12px;
      background: #0f172a;
      color: #fff;
      font-size: 20px;
      font-weight: 800;
    }
    .eyebrow { margin: 0 0 3px; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .page-header h1 { margin: 0; color: #0f172a; font-size: 20px; }

    .delivery-card, .message-card, .map-card {
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 4px 12px rgb(15 23 42 / 4%);
    }

    .delivery-card { padding: 18px; }
    .delivery-card-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .delivery-card-heading h2 { margin: 0; color: #0f172a; font-size: 22px; font-weight: 700; text-transform: capitalize; }
    .status-pulse { width: 12px; height: 12px; border-radius: 50%; background: #16a34a; box-shadow: 0 0 0 5px #dcfce7; }

    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 12px; margin: 20px 0; }
    .details-grid > div { display: grid; gap: 4px; min-width: 0; }
    .detail-label { color: #64748b; font-size: 12px; }
    .details-grid strong { overflow-wrap: anywhere; color: #0f172a; font-size: 14px; font-weight: 600; }
    .last-update { grid-column: 1 / -1; }

    .call-driver {
      display: flex;
      min-height: 48px;
      align-items: center;
      justify-content: center;
      gap: 9px;
      border-radius: 9px;
      background: #15803d;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      text-decoration: none;
    }
    .call-driver:hover { background: #166534; }

    .map-card { position: relative; height: min(55vh, 430px); min-height: 320px; overflow: hidden; }
    .map-card app-tracking-map { display: block; width: 100%; height: 100%; }
    .map-empty {
      position: absolute;
      z-index: 500;
      top: 50%;
      left: 50%;
      width: max-content;
      max-width: calc(100% - 32px);
      padding: 9px 12px;
      transform: translate(-50%, -50%);
      border-radius: 8px;
      background: rgb(255 255 255 / 94%);
      color: #475569;
      font-size: 12px;
      text-align: center;
    }
    .map-attribution {
      position: absolute;
      z-index: 500;
      right: 6px;
      bottom: 6px;
      padding: 3px 6px;
      border-radius: 4px;
      background: rgb(255 255 255 / 90%);
      color: #475569;
      font-size: 10px;
    }

    .message-card { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .message-card p { margin: 0; color: #475569; font-size: 14px; }
    .error-card { display: block; border-color: #fecaca; background: #fff7f7; }
    .error-card h2 { margin: 0 0 5px; color: #991b1b; font-size: 16px; }
    .error-card p { color: #7f1d1d; }
    .loading-indicator { width: 16px; height: 16px; border: 2px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin .8s linear infinite; }
    .page-footer { padding: 0 4px; color: #64748b; font-size: 11px; line-height: 1.5; text-align: center; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @media (min-width: 600px) {
      .public-page { gap: 18px; padding: 28px 20px 36px; }
      .delivery-card { padding: 24px; }
      .details-grid { grid-template-columns: 1fr 1fr 1.3fr; }
      .last-update { grid-column: auto; }
    }
  `],
})
export class PublicTrackingComponent implements OnInit, OnDestroy {
  readonly tracking = inject(PublicTrackingService);
  private readonly route = inject(ActivatedRoute);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly routeSubscription = new Subscription();
  private refreshTimer: number | null = null;

  readonly markers = computed<TrackingMapMarker[]>(() => {
    const snapshot = this.tracking.snapshot();
    if (!snapshot?.position) return [];

    return [{
      id: 'public-delivery',
      kind: 'vehicle',
      latitude: snapshot.position.lat,
      longitude: snapshot.position.lng,
      label: snapshot.vehicleRegistration,
      color: '#2563eb',
      popupTitle: `Delivery with ${snapshot.vehicleRegistration}`,
      popupDetails: [
        `Driver: ${snapshot.driverFirstName}`,
        `Status: ${snapshot.status.replace('_', ' ')}`,
      ],
    }];
  });

  readonly center = computed<[number, number]>(() => {
    const position = this.tracking.snapshot()?.position;
    return position ? [position.lat, position.lng] : [9.082, 8.6753];
  });

  readonly zoom = computed(() => (this.tracking.snapshot()?.position ? 13 : 6));

  ngOnInit(): void {
    this.routeSubscription.add(
      this.route.paramMap
        .pipe(
          map((params) => params.get('token') ?? ''),
          distinctUntilChanged()
        )
        .subscribe((token) => this.startTracking(token))
    );
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
    if (this.refreshTimer !== null) window.clearInterval(this.refreshTimer);
    this.tracking.disconnect();
  }

  private startTracking(token: string): void {
    if (this.refreshTimer !== null) window.clearInterval(this.refreshTimer);
    this.tracking.load(token);

    if (this.isBrowser) {
      this.refreshTimer = window.setInterval(() => {
        if (!this.tracking.isExpired()) this.tracking.load(token);
      }, REFRESH_INTERVAL_MS);
    }
  }
}
