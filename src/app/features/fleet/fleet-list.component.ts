import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { VehicleService } from '../../core/services/vehicle.service';
import { vehicleStatusBadge, vehicleStatusLabel, vehicleTypeLabel } from '../../shared/utils/status.utils';
import { ActionOverflowMenuComponent } from '../alm/components/action-overflow-menu/action-overflow-menu.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-fleet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ActionOverflowMenuComponent],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Fleet</h1>
          <span class="header-subtitle">{{ metrics().total }} vehicles</span>
        </div>
      </div>
      <div class="header-right">
        <button id="addVehicleBtn" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Vehicle
        </button>
      </div>
    </header>
    <main class="page-container">
      <!-- Fleet KPI strip -->
      <div class="fleet-kpis">
        @for (m of metricCards(); track m.label) {
          <div class="panel fleet-kpi-card">
            <div class="kpi-value data-mono" style="font-size:24px;">{{ m.value }}</div>
            <div class="kpi-label">{{ m.label }}</div>
          </div>
        }
      </div>

      <div class="panel">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Make / Model</th>
                <th>Fuel</th>
                <th>Driver</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (v of vehicleService.vehicles(); track v.id) {
                <tr>
                  <td><span class="data-mono" style="color:var(--brand);font-weight:600;">{{ v.registrationNumber }}</span></td>
                  <td class="muted">{{ vehicleTypeLabel(v.type) }}</td>
                  <td class="muted">{{ v.capacity }} kg</td>
                  <td class="muted">{{ v.make }} {{ v.model }}</td>
                  <td>
                    @if (v.fuelLevel != null) {
                      <div class="progress-bar" style="width:60px;">
                        <div class="progress-fill" [class]="fuelClass(v.fuelLevel)" [style.width]="v.fuelLevel + '%'"></div>
                      </div>
                      <span style="font-size:11px;color:var(--text-muted);">{{ v.fuelLevel }}%</span>
                    } @else { — }
                  </td>
                  <td class="muted">{{ v.currentDriverId ?? '—' }}</td>
                  <td><span class="badge" [ngClass]="vehicleStatusBadge(v.status)">{{ vehicleStatusLabel(v.status) }}</span></td>
                  <td style="text-align: right;">
                    <app-action-overflow-menu
                      [entityId]="v.id"
                      [entityName]="v.registrationNumber"
                      (view)="onView(v.id)"
                      (edit)="onEdit(v.id)"
                      (deleteConfirmed)="onDelete(v.id)"
                    ></app-action-overflow-menu>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `,
  styles: [`
    .fleet-kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; }
    .fleet-kpi-card { padding: 16px; text-align: center; }
  `]
})
export class FleetListComponent {
  readonly vehicleService     = inject(VehicleService);
  private readonly router      = inject(Router);
  private readonly toast       = inject(ToastService);
  readonly vehicleStatusBadge = vehicleStatusBadge;
  readonly vehicleStatusLabel = vehicleStatusLabel;
  readonly vehicleTypeLabel   = vehicleTypeLabel;

  readonly metrics = computed(() => this.vehicleService.getMetrics());
  readonly metricCards = computed(() => {
    const m = this.metrics();
    return [
      { label: 'Total', value: m.total },
      { label: 'In Transit', value: m.active },
      { label: 'Available', value: m.available },
      { label: 'Assigned', value: m.assigned },
      { label: 'Maintenance', value: m.maintenance },
      { label: 'Offline', value: m.offline },
    ];
  });

  fuelClass(level: number): string {
    if (level <= 20) return 'error';
    if (level <= 40) return 'warning';
    return 'success';
  }

  onView(id?: string): void {
    if (id) {
      this.router.navigate(['/fleet', id]);
    }
  }

  onEdit(id?: string): void {
    this.toast.info(`Editing vehicle profile for ${id}`);
  }

  onDelete(id?: string): void {
    this.toast.show(`Vehicle ${id} removed from active fleet.`, 'error');
  }
}
