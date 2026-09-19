import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoadService } from '../../core/services/load.service';
import { RouteService } from '../../core/services/route.service';
import { loadStatusBadge, loadStatusLabel } from '../../shared/utils/status.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

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
        </div>
      }
    </header>
    <main class="page-container">
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
  `
})
export class LoadDetailComponent {
  private route       = inject(ActivatedRoute);
  private loadService = inject(LoadService);

  readonly loadStatusBadge = loadStatusBadge;
  readonly loadStatusLabel = loadStatusLabel;

  readonly load = toSignal(
    this.route.paramMap.pipe(switchMap(p => this.loadService.getLoad(p.get('id') ?? '')))
  );

  progress(l: any): number {
    if (!l.totalStops) return 0;
    return Math.round((l.completedStops / l.totalStops) * 100);
  }
}
