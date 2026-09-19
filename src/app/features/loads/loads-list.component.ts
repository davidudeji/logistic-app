import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoadService } from '../../core/services/load.service';
import { DriverService } from '../../core/services/driver.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { loadStatusBadge, loadStatusLabel } from '../../shared/utils/status.utils';

@Component({
  selector: 'app-loads-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Loads</h1>
          <span class="header-subtitle">Plan and monitor delivery loads</span>
        </div>
        <div class="search-bar">
          <span class="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input id="loadSearch" type="text" class="search-input" placeholder="Search loads..." [(ngModel)]="q"/>
        </div>
      </div>
      <div class="header-right">
        <select class="form-select" style="height:34px;width:160px;" [(ngModel)]="statusFilter">
          <option value="">All Statuses</option>
          <option value="PLANNING">Planning</option>
          <option value="READY">Ready</option>
          <option value="DISPATCHED">Dispatched</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <a routerLink="/dispatch" class="btn btn-primary" id="newLoadBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Load
        </a>
      </div>
    </header>
    <main class="page-container">
      <div class="panel">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Driver</th>
                <th>Vehicle</th>
                <th>Stops</th>
                <th>Progress</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (load of filteredLoads(); track load.id) {
                <tr>
                  <td><span class="data-mono" style="color:var(--brand);font-weight:600;">{{ load.reference }}</span></td>
                  <td class="muted">{{ load.driverId ?? '—' }}</td>
                  <td class="muted">{{ load.vehicleId ?? '—' }}</td>
                  <td class="muted">{{ load.completedStops }} / {{ load.totalStops }}</td>
                  <td style="min-width:110px;">
                    <div class="progress-bar"><div class="progress-fill" [style.width]="progress(load) + '%'"></div></div>
                    <span style="font-size:11px;color:var(--text-muted);">{{ progress(load) }}%</span>
                  </td>
                  <td class="muted">{{ load.scheduledDate | date:'d MMM' }}</td>
                  <td><span class="badge" [ngClass]="loadStatusBadge(load.status)">{{ loadStatusLabel(load.status) }}</span></td>
                  <td><a [routerLink]="['/loads', load.id]" class="btn btn-xs btn-secondary">View</a></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `
})
export class LoadsListComponent {
  private loadService = inject(LoadService);
  q = ''; statusFilter = '';
  readonly loadStatusBadge = loadStatusBadge;
  readonly loadStatusLabel = loadStatusLabel;

  filteredLoads = computed(() => {
    let loads = this.loadService.loads();
    if (this.q) { const q = this.q.toLowerCase(); loads = loads.filter(l => l.reference.toLowerCase().includes(q)); }
    if (this.statusFilter) { loads = loads.filter(l => l.status === this.statusFilter); }
    return loads;
  });

  progress(load: any): number {
    if (!load.totalStops) return 0;
    return Math.round((load.completedStops / load.totalStops) * 100);
  }
}
