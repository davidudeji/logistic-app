import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FleetTelemetryService } from '../../services/fleet-telemetry.service';
import { FleetLiveMapComponent } from '../../components/fleet-live-map/fleet-live-map.component';
import { FleetTelemetryPanelComponent } from '../../components/fleet-telemetry-panel/fleet-telemetry-panel.component';
import { ActionOverflowMenuComponent } from '../../components/action-overflow-menu/action-overflow-menu.component';
import { OfflineSyncIndicatorComponent } from '../../components/offline-sync-indicator/offline-sync-indicator.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-fleet-monitoring-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FleetLiveMapComponent,
    FleetTelemetryPanelComponent,
    ActionOverflowMenuComponent,
    OfflineSyncIndicatorComponent,
  ],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">ALM Fleet Telemetry & Monitoring</h1>
          <span class="header-subtitle">Real-time GPS tracking, vehicle health, and active dispatches</span>
        </div>
      </div>
      <div class="header-right">
        <app-offline-sync-indicator></app-offline-sync-indicator>
        <a [routerLink]="['/alm/routes']" class="btn btn-secondary btn-sm">
          Route Planner
        </a>
      </div>
    </header>

    <main class="page-container">
      <!-- KPI Metric Strip -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">{{ fleetTelemetryService.vehiclesList().length }}</div>
          <div class="kpi-label">Tracked Vehicles</div>
          <div class="kpi-sub">Total operational fleet</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color: #2d6a4f;">{{ fleetTelemetryService.activeVehiclesCount() }}</div>
          <div class="kpi-label">Active Transmitting</div>
          <div class="kpi-sub">Transmitted &lt; 5m ago</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value" style="color: #7c5a00;">{{ fleetTelemetryService.staleVehiclesCount() }}</div>
          <div class="kpi-label">Stale Signals</div>
          <div class="kpi-sub">No ping &gt; 5m</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">99.4%</div>
          <div class="kpi-label">Telemetry Ingestion</div>
          <div class="kpi-sub">WebSocket uptime</div>
        </div>
      </div>

      <!-- Main Map & Telemetry Feed Grid -->
      <div class="map-and-feed-grid">
        <div class="map-col">
          <app-fleet-live-map></app-fleet-live-map>
        </div>
        <div class="feed-col">
          <app-fleet-telemetry-panel></app-fleet-telemetry-panel>
        </div>
      </div>

      <!-- Active Vehicles Data Table with Accessible 3-Dot Overflow Actions -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title-group">
            <h3 class="panel-title">Active Fleet Roster & Assigned Dispatches</h3>
            <span class="panel-count">{{ fleetTelemetryService.vehiclesList().length }}</span>
          </div>
        </div>
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Asset ID</th>
                <th>Driver</th>
                <th>Speed & Heading</th>
                <th>Status</th>
                <th>Coordinates</th>
                <th>Last Update</th>
                <th style="width: 50px; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (v of fleetTelemetryService.vehiclesList(); track v.assetId) {
                <tr>
                  <td>
                    <span class="data-mono" style="font-weight:600;">{{ v.registrationNumber }}</span>
                  </td>
                  <td class="muted">{{ v.assetId }}</td>
                  <td>{{ v.driverName || 'Unassigned' }}</td>
                  <td>{{ v.speedKph }} km/h · {{ v.heading }}°</td>
                  <td>
                    <span class="badge" [ngClass]="badgeClass(v.status)">
                      {{ v.status }}
                    </span>
                  </td>
                  <td class="muted">{{ v.latitude.toFixed(4) }}, {{ v.longitude.toFixed(4) }}</td>
                  <td class="muted">{{ formatTime(v.lastUpdated) }}</td>
                  <td style="text-align: right;">
                    <!-- 3-Dot Overflow Menu with View, Edit, Delete -->
                    <app-action-overflow-menu
                      [entityId]="v.assetId"
                      [entityName]="v.registrationNumber + ' (' + v.assetId + ')'"
                      (view)="onViewVehicle(v.assetId)"
                      (edit)="onEditVehicle(v.assetId)"
                      (deleteConfirmed)="onDeleteVehicle(v.assetId)"
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
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .map-and-feed-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
      min-height: 480px;
    }

    @media (max-width: 950px) {
      .map-and-feed-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class FleetMonitoringPageComponent {
  readonly fleetTelemetryService = inject(FleetTelemetryService);
  readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  badgeClass(status: string): string {
    if (status === 'active') return 'badge-success';
    if (status === 'stale') return 'badge-warning';
    return 'badge-neutral';
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  onViewVehicle(id?: string): void {
    this.toast.info(`Inspecting telemetry telemetry stream for asset ${id}`);
    if (id) this.fleetTelemetryService.selectVehicle(id);
  }

  onEditVehicle(id?: string): void {
    this.toast.info(`Opening vehicle dispatch configuration for asset ${id}`);
  }

  onDeleteVehicle(id?: string): void {
    this.toast.show(`Vehicle ${id} decommissioned from active tracking`, 'error');
  }
}
