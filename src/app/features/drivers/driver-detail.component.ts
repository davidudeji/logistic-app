import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DriverService } from '../../core/services/driver.service';
import { driverStatusBadge, driverStatusLabel } from '../../shared/utils/status.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-driver-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <a routerLink="/drivers" class="btn btn-sm btn-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Drivers
        </a>
        <div class="header-title-group" style="margin-left:8px;">
          <h1 class="header-title">{{ driver()?.name }}</h1>
          <span class="header-subtitle">Driver Profile</span>
        </div>
      </div>
    </header>
    <main class="page-container">
      @if (driver(); as d) {
        <div class="panel" style="max-width:500px;">
          <div class="panel-header">
            <div style="display:flex;align-items:center;gap:14px;">
              <div style="width:48px;height:48px;border-radius:50%;background:var(--brand);color:white;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;">{{ d.avatarInitials }}</div>
              <div>
                <div style="font-size:17px;font-weight:700;">{{ d.name }}</div>
                <span class="badge" [ngClass]="driverStatusBadge(d.status)">{{ driverStatusLabel(d.status) }}</span>
              </div>
            </div>
          </div>
          <div class="panel-body" style="display:grid;gap:12px;">
            <div><div class="form-label">Phone</div><div>{{ d.phone }}</div></div>
            <div><div class="form-label">On-Time Rate</div><div>{{ d.onTimeRate ?? '—' }}%</div></div>
            <div><div class="form-label">Total Deliveries</div><div>{{ d.totalDeliveries ?? '—' }}</div></div>
            @if (d.currentLoadId) {
              <div><div class="form-label">Current Load</div>
                <a [routerLink]="['/loads', d.currentLoadId]" class="data-mono" style="color:var(--brand);">{{ d.currentLoadId }}</a>
              </div>
            }
            @if (d.currentVehicleId) {
              <div><div class="form-label">Assigned Vehicle</div>
                <a [routerLink]="['/fleet', d.currentVehicleId]" class="data-mono" style="color:var(--brand);">{{ d.currentVehicleId }}</a>
              </div>
            }
          </div>
        </div>
      }
    </main>
  `
})
export class DriverDetailComponent {
  private route         = inject(ActivatedRoute);
  private driverService = inject(DriverService);

  readonly driverStatusBadge = driverStatusBadge;
  readonly driverStatusLabel = driverStatusLabel;

  readonly driver = toSignal(
    this.route.paramMap.pipe(switchMap(p => this.driverService.getDriver(p.get('id') ?? '')))
  );
}
