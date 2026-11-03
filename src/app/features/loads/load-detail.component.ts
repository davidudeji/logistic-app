import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadService } from '../../core/services/load.service';
import { RouteService } from '../../core/services/route.service';
import { loadStatusBadge, loadStatusLabel } from '../../shared/utils/status.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { TrackingShareService } from '../../core/tracking/tracking-share.service';

@Component({
  selector: 'app-load-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <a routerLink="/loads" class="btn btn-sm btn-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Loads
        </a>
        <div class="header-title-group" style="margin-left:8px;">
          <h1 class="header-title">{{ load()?.reference }}</h1>
          <span class="header-subtitle">Load Detail</span>
        </div>
      </div>
      @if (load()) {
        <div class="header-right">
          <span class="badge" [ngClass]="loadStatusBadge(load()!.status)">{{ loadStatusLabel(load()!.status) }}</span>
          <a [routerLink]="['/driver/tracking', load()!.id]" class="btn btn-sm btn-secondary">
            Driver trip
          </a>
          <button
            type="button"
            class="btn btn-sm btn-secondary"
            [disabled]="isSharing()"
            (click)="shareTrackingLink()"
          >
            {{ isSharing() ? 'Creating link…' : 'Share tracking link' }}
          </button>
        </div>
      }
    </header>
    <main class="page-container">
      @if (shareError()) {
        <div class="tracking-share-message tracking-share-error" role="alert">
          {{ shareError() }}
        </div>
      }
      @if (shareStatus()) {
        <div class="tracking-share-message" role="status">{{ shareStatus() }}</div>
      }
      @if (shareUrl()) {
        <section class="tracking-share-panel" aria-label="Public tracking link">
          <label for="tracking-share-url">Customer tracking URL</label>
          <input id="tracking-share-url" type="url" readonly [value]="shareUrl()" />
          @if (whatsAppUrl(); as url) {
            <a class="btn btn-sm btn-secondary" [href]="url" target="_blank" rel="noopener noreferrer">
              Open WhatsApp
            </a>
          }
        </section>
      }
      @if (load(); as l) {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="panel">
            <div class="panel-header"><h2 class="panel-title">Load Details</h2></div>
            <div class="panel-body" style="display:grid;gap:12px;">
              <div><div class="form-label">Reference</div><div class="data-mono" style="font-weight:600;">{{ l.reference }}</div></div>
              <div><div class="form-label">Driver</div><div>{{ l.driverId ?? '—' }}</div></div>
              <div><div class="form-label">Vehicle</div><div>{{ l.vehicleId ?? '—' }}</div></div>
              <div><div class="form-label">Scheduled Date</div><div>{{ l.scheduledDate | date:'d MMMM yyyy' }}</div></div>
              <div><div class="form-label">Total Weight</div><div>{{ l.totalWeight ?? '—' }} kg</div></div>
              <div>
                <div class="form-label">Progress</div>
                <div class="progress-bar" style="margin-top:6px;">
                  <div class="progress-fill" [style.width]="progress(l) + '%'"></div>
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">
                  {{ l.completedStops }} of {{ l.totalStops }} stops complete
                </div>
              </div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-header"><h2 class="panel-title">Orders</h2></div>
            <div class="panel-body">
              @for (ordId of l.orderIds; track ordId) {
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle);">
                  <span class="data-mono" style="color:var(--brand);font-weight:600;">{{ ordId }}</span>
                  <a [routerLink]="['/orders', ordId]" class="btn btn-xs btn-secondary">View Order</a>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="state-container"><div class="spinner"></div><div class="state-title">Loading load...</div></div>
      }
    </main>
  `,
  styles: [`
    .tracking-share-message {
      margin-bottom: 12px;
      padding: 10px 12px;
      border-radius: 6px;
      background: #f0fdf4;
      color: #166534;
      font-size: 13px;
    }

    .tracking-share-error { background: #fef2f2; color: #991b1b; }

    .tracking-share-panel {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
    }

    .tracking-share-panel label { color: #475569; font-size: 12px; }
    .tracking-share-panel input {
      flex: 1;
      min-width: 0;
      height: 38px;
      padding: 0 8px;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
    }

    @media (max-width: 700px) {
      .tracking-share-panel { align-items: stretch; flex-direction: column; }
    }
  `]
})
export class LoadDetailComponent {
  private route       = inject(ActivatedRoute);
  private loadService = inject(LoadService);
  private readonly trackingShareService = inject(TrackingShareService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly isSharing = signal(false);
  readonly shareError = signal<string | null>(null);
  readonly shareStatus = signal<string | null>(null);
  readonly shareUrl = signal<string | null>(null);
  readonly whatsAppUrl = computed(() => {
    const url = this.shareUrl();
    return url ? `https://wa.me/?text=${encodeURIComponent(`Track your delivery: ${url}`)}` : null;
  });

  readonly loadStatusBadge = loadStatusBadge;
  readonly loadStatusLabel = loadStatusLabel;

  readonly load = toSignal(
    this.route.paramMap.pipe(switchMap(p => this.loadService.getLoad(p.get('id') ?? '')))
  );

  progress(l: any): number {
    if (!l.totalStops) return 0;
    return Math.round((l.completedStops / l.totalStops) * 100);
  }

  async shareTrackingLink(): Promise<void> {
    const load = this.load();
    if (!load || !this.isBrowser || this.isSharing()) return;

    this.isSharing.set(true);
    this.shareError.set(null);
    this.shareStatus.set(null);
    this.shareUrl.set(null);

    const shareWindow = window.open('about:blank', '_blank');
    try {
      const { token } = await this.trackingShareService.createPublicLink(load.id);
      const url = `${window.location.origin}/track/${encodeURIComponent(token)}`;
      this.shareUrl.set(url);

      try {
        if (!navigator.clipboard?.writeText) {
          throw new Error('Clipboard access is unavailable in this browser.');
        }
        await navigator.clipboard.writeText(url);
        this.shareStatus.set(
          shareWindow
            ? 'Tracking link copied. WhatsApp has opened in a new tab.'
            : 'Tracking link copied. Use Open WhatsApp to share it.'
        );
      } catch (error: unknown) {
        this.shareError.set(
          error instanceof Error
            ? `The link was created, but could not be copied: ${error.message}`
            : 'The link was created, but could not be copied. Copy the URL below.'
        );
      }

      const whatsAppUrl = this.whatsAppUrl();
      if (shareWindow && whatsAppUrl) {
        shareWindow.opener = null;
        shareWindow.location.href = whatsAppUrl;
      }
    } catch (error) {
      shareWindow?.close();
      this.shareError.set(
        error instanceof Error ? error.message : 'Could not create a customer tracking link.'
      );
    } finally {
      this.isSharing.set(false);
    }
  }
}
