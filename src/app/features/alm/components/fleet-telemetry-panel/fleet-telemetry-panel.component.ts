import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FleetTelemetryService } from '../../services/fleet-telemetry.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-fleet-telemetry-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="telemetry-panel">
      <div class="panel-header">
        <h3 class="panel-title">Fleet Telemetry Feed</h3>
        <span class="vehicle-count">{{ filteredVehicles().length }} Vehicles</span>
      </div>

      <!-- Search & Filters -->
      <div class="search-and-filter">
        <input
          type="text"
          class="form-input search-input"
          placeholder="Search registration, driver, asset..."
          [(ngModel)]="searchQuery"
        />
        <div class="filter-pills">
          <button
            type="button"
            class="pill-btn"
            [class.active]="filterStatus() === 'all'"
            (click)="filterStatus.set('all')"
          >
            All
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.active]="filterStatus() === 'active'"
            (click)="filterStatus.set('active')"
          >
            Active ({{ fleetTelemetryService.activeVehiclesCount() }})
          </button>
          <button
            type="button"
            class="pill-btn"
            [class.active]="filterStatus() === 'stale'"
            (click)="filterStatus.set('stale')"
          >
            Stale ({{ fleetTelemetryService.staleVehiclesCount() }})
          </button>
        </div>
      </div>

      <!-- Vehicle Telemetry List -->
      <div class="vehicle-list">
        @for (v of filteredVehicles(); track v.assetId) {
          <div
            class="vehicle-card"
            [class.selected]="fleetTelemetryService.selectedAssetId() === v.assetId"
            (click)="fleetTelemetryService.selectVehicle(v.assetId)"
          >
            <div class="card-header">
              <span class="reg-number">{{ v.registrationNumber }}</span>
              <span class="status-badge" [ngClass]="'status-' + v.status">
                {{ v.status }}
              </span>
            </div>
            <div class="card-row">
              <span class="card-label">Driver:</span>
              <span class="card-val">{{ v.driverName || 'Unassigned' }}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Telemetry:</span>
              <span class="card-val">{{ v.speedKph }} km/h · {{ v.heading }}°</span>
            </div>
            <div class="card-footer">
              <span class="coords">{{ v.latitude.toFixed(4) }}, {{ v.longitude.toFixed(4) }}</span>
              <span class="time-ago">{{ formatTime(v.lastUpdated) }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Driver Telemetry Broadcast Simulator -->
      <div class="broadcast-sim-section">
        <div class="sim-header">
          <span class="sim-title">Driver Telemetry Simulator</span>
          <span class="sim-hint">Broadcast live GPS ping</span>
        </div>
        <div class="sim-controls">
          <div class="sim-row">
            <label class="sim-label">Target Asset:</label>
            <select class="form-select sim-select" [(ngModel)]="simAssetId">
              @for (v of fleetTelemetryService.vehiclesList(); track v.assetId) {
                <option [value]="v.assetId">{{ v.registrationNumber }} ({{ v.assetId }})</option>
              }
            </select>
          </div>
          <div class="sim-row-grid">
            <input
              type="number"
              class="form-input sim-input"
              placeholder="Speed (km/h)"
              [(ngModel)]="simSpeed"
            />
            <input
              type="number"
              class="form-input sim-input"
              placeholder="Heading (°)"
              [(ngModel)]="simHeading"
            />
          </div>
          <button
            type="button"
            class="btn btn-primary sim-btn"
            (click)="onSimulateBroadcast()"
          >
            Send Location Broadcast
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .telemetry-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .panel-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 16px;
      margin: 0;
      color: #000000;
    }

    .vehicle-count {
      font-size: 12px;
      color: #666666;
    }

    .search-and-filter {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .search-input {
      height: 32px;
      font-size: 13px;
    }

    .filter-pills {
      display: flex;
      gap: 6px;
    }

    .pill-btn {
      padding: 3px 8px;
      border: 1px solid #e5e7eb;
      background: transparent;
      border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11px;
      cursor: pointer;
    }

    .pill-btn.active {
      background: #000000;
      color: #fbfbfb;
      border-color: #000000;
    }

    .vehicle-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .vehicle-card {
      padding: 10px 12px;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #ffffff;
      cursor: pointer;
      transition: border-color 120ms ease, background 120ms ease;
    }

    .vehicle-card:hover {
      background: #fafafa;
      border-color: #cccccc;
    }

    .vehicle-card.selected {
      border-color: #000000;
      background: rgba(0, 0, 0, 0.03);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .reg-number {
      font-weight: 600;
      font-size: 13px;
      color: #000000;
    }

    .status-badge {
      font-size: 10px;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid;
    }

    .status-active { color: #2d6a4f; border-color: #2d6a4f; }
    .status-stale  { color: #7c5a00; border-color: #7c5a00; }
    .status-idle   { color: #666666; border-color: #666666; }

    .card-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #444444;
      margin-bottom: 2px;
    }

    .card-label { color: #888888; }

    .card-footer {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #888888;
      margin-top: 4px;
      border-top: 1px solid #f4f4f5;
      padding-top: 4px;
    }

    .broadcast-sim-section {
      padding: 12px 14px;
      border-top: 1px solid #e5e7eb;
      background: #f7f7f7;
    }

    .sim-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 8px;
    }

    .sim-title {
      font-size: 12px;
      font-weight: 600;
      color: #000000;
    }

    .sim-hint {
      font-size: 10px;
      color: #888888;
    }

    .sim-controls {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sim-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sim-label { font-size: 11px; color: #555555; }
    .sim-select { height: 28px; font-size: 12px; flex: 1; }

    .sim-row-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .sim-input { height: 28px; font-size: 12px; }
    .sim-btn {
      height: 32px;
      min-height: 32px;
      font-size: 12px;
      justify-content: center;
      width: 100%;
    }
  `],
})
export class FleetTelemetryPanelComponent {
  readonly fleetTelemetryService = inject(FleetTelemetryService);
  readonly authService = inject(AuthService);

  searchQuery = '';
  readonly filterStatus = signal<'all' | 'active' | 'stale'>('all');

  simAssetId = 'VEH-TRK-101';
  simSpeed = 75;
  simHeading = 60;

  readonly filteredVehicles = computed(() => {
    let list = this.fleetTelemetryService.vehiclesList();
    const query = this.searchQuery.trim().toLowerCase();
    const status = this.filterStatus();

    if (status !== 'all') {
      list = list.filter((v) => v.status === status);
    }

    if (query) {
      list = list.filter(
        (v) =>
          v.registrationNumber.toLowerCase().includes(query) ||
          v.assetId.toLowerCase().includes(query) ||
          (v.driverName && v.driverName.toLowerCase().includes(query))
      );
    }

    return list;
  });

  formatTime(iso: string): string {
    const diffSeconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const mins = Math.round(diffSeconds / 60);
    return `${mins}m ago`;
  }

  onSimulateBroadcast(): void {
    const v = this.fleetTelemetryService.vehiclesList().find((item) => item.assetId === this.simAssetId);
    const baseLat = v ? v.latitude : 6.5244;
    const baseLng = v ? v.longitude : 3.3792;

    // Small jitter to simulate movement
    const jitterLat = baseLat + (Math.random() - 0.45) * 0.005;
    const jitterLng = baseLng + (Math.random() - 0.45) * 0.005;

    this.fleetTelemetryService.broadcastDriverLocation({
      assetId: this.simAssetId,
      latitude: jitterLat,
      longitude: jitterLng,
      speedKph: Number(this.simSpeed),
      heading: Number(this.simHeading),
      telemetryTimestamp: new Date().toISOString(),
    });
  }
}
