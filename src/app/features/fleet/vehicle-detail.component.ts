import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { VehicleService } from '../../core/services/vehicle.service';
import { vehicleStatusBadge, vehicleStatusLabel, vehicleTypeLabel } from '../../shared/utils/status.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <a routerLink="/fleet" class="btn btn-sm btn-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Fleet
        </a>
        <div class="header-title-group" style="margin-left:8px;">
          <h1 class="header-title">{{ vehicle()?.registrationNumber }}</h1>
          <span class="header-subtitle">Vehicle Detail</span>
        </div>
      </div>
    </header>
    <main class="page-container">
      @if (vehicle(); as v) {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="panel">
            <div class="panel-header"><h2 class="panel-title">Vehicle Info</h2></div>
            <div class="panel-body" style="display:grid;gap:12px;">
              <div><div class="form-label">Registration</div><div class="data-mono" style="font-weight:600;">{{ v.registrationNumber }}</div></div>
              <div><div class="form-label">Type</div><div>{{ vehicleTypeLabel(v.type) }}</div></div>
              <div><div class="form-label">Make / Model</div><div>{{ v.make }} {{ v.model }} ({{ v.year }})</div></div>
              <div><div class="form-label">Capacity</div><div>{{ v.capacity }} kg</div></div>
              <div>
                <div class="form-label">Status</div>
                <span class="badge" [ngClass]="vehicleStatusBadge(v.status)">{{ vehicleStatusLabel(v.status) }}</span>
              </div>
              @if (v.fuelLevel != null) {
                <div>
                  <div class="form-label">Fuel Level</div>
                  <div class="progress-bar" style="margin-top:6px;max-width:200px;">
                    <div class="progress-fill" [class]="fuelClass(v.fuelLevel)" [style.width]="v.fuelLevel + '%'"></div>
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:4px;">{{ v.fuelLevel }}%</div>
                </div>
              }
              @if (v.currentDriverId) {
                <div><div class="form-label">Current Driver</div>
                  <a [routerLink]="['/drivers', v.currentDriverId]" style="color:var(--brand);">{{ v.currentDriverId }}</a>
                </div>
              }
              @if (v.currentLoadId) {
                <div><div class="form-label">Current Load</div>
                  <a [routerLink]="['/loads', v.currentLoadId]" class="data-mono" style="color:var(--brand);">{{ v.currentLoadId }}</a>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="state-container"><div class="spinner"></div><div class="state-title">Loading vehicle...</div></div>
      }
    </main>
  `
})
export class VehicleDetailComponent {
  private route          = inject(ActivatedRoute);
  private vehicleService = inject(VehicleService);

  readonly vehicleStatusBadge = vehicleStatusBadge;
  readonly vehicleStatusLabel = vehicleStatusLabel;
  readonly vehicleTypeLabel   = vehicleTypeLabel;

  readonly vehicle = toSignal(
    this.route.paramMap.pipe(switchMap(p => this.vehicleService.getVehicle(p.get('id') ?? '')))
  );

  fuelClass(level: number): string {
    if (level <= 20) return 'error';
    if (level <= 40) return 'warning';
    return 'success';
  }
}
