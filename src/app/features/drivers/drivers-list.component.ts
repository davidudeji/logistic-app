import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DriverService } from '../../core/services/driver.service';
import { driverStatusBadge, driverStatusLabel } from '../../shared/utils/status.utils';

@Component({
  selector: 'app-drivers-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Drivers</h1>
          <span class="header-subtitle">{{ driverService.drivers().length }} total · {{ available() }} available</span>
        </div>
      </div>
      <div class="header-right">
        <button id="addDriverBtn" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Driver
        </button>
      </div>
    </header>
    <main class="page-container">
      <div class="drivers-grid">
        @for (driver of driverService.drivers(); track driver.id) {
          <div class="panel driver-card">
            <div class="driver-avatar">{{ driver.avatarInitials }}</div>
            <div class="driver-info">
              <div class="driver-name">{{ driver.name }}</div>
              <div class="driver-phone">{{ driver.phone }}</div>
              <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
                <span class="badge" [ngClass]="driverStatusBadge(driver.status)">{{ driverStatusLabel(driver.status) }}</span>
                @if (driver.onTimeRate != null) {
                  <span style="font-size:11px;color:var(--text-muted);">{{ driver.onTimeRate }}% on-time</span>
                }
              </div>
              @if (driver.currentLoadId) {
                <div style="margin-top:6px;font-size:12px;color:var(--text-muted);">
                  Load: <a [routerLink]="['/loads', driver.currentLoadId]" class="data-mono" style="color:var(--brand);">{{ driver.currentLoadId }}</a>
                </div>
              }
            </div>
            <a [routerLink]="['/drivers', driver.id]" class="btn btn-xs btn-secondary" style="align-self:flex-start;">View</a>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .drivers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .driver-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; }
    .driver-avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: var(--brand); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .driver-info { flex: 1; }
    .driver-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .driver-phone { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  `]
})
export class DriversListComponent {
  readonly driverService = inject(DriverService);
  readonly driverStatusBadge = driverStatusBadge;
  readonly driverStatusLabel = driverStatusLabel;
  readonly available = computed(() => this.driverService.drivers().filter(d => d.status === 'AVAILABLE').length);
}
