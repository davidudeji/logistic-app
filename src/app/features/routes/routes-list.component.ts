import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RouteService } from '../../core/services/route.service';

@Component({
  selector: 'app-routes-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Routes</h1>
          <span class="header-subtitle">Planned and active delivery routes</span>
        </div>
      </div>
    </header>
    <main class="page-container">
      <div class="panel">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Load</th>
                <th>Stops</th>
                <th>Distance</th>
                <th>Est. Duration</th>
                <th>Optimized</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (route of routeService.routes(); track route.id) {
                <tr>
                  <td data-label="Route ID"><span class="data-mono" style="color:var(--brand);font-weight:600;">{{ route.id }}</span></td>
                  <td data-label="Load">
                    <a [routerLink]="['/loads', route.loadId]" class="data-mono" style="color:var(--brand);">{{ route.loadId }}</a>
                  </td>
                  <td data-label="Stops" class="muted">{{ route.stops.length }}</td>
                  <td data-label="Distance" class="muted">{{ route.totalDistance }} km</td>
                  <td data-label="Est. duration" class="muted">{{ durationLabel(route.estimatedDuration) }}</td>
                  <td data-label="Optimization">
                    @if (route.optimized) {
                      <span class="badge badge-success">Optimized</span>
                    } @else {
                      <span class="badge badge-neutral">Manual</span>
                    }
                  </td>
                  <td data-label="Status">
                    <span class="badge" [ngClass]="routeStatusBadge(route.status)">{{ route.status }}</span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `
})
export class RoutesListComponent {
  readonly routeService = inject(RouteService);

  routeStatusBadge(s: string): string {
    const m: Record<string, string> = {
      PLANNED: 'badge-neutral', ACTIVE: 'badge-info', COMPLETED: 'badge-success', CANCELLED: 'badge-neutral'
    };
    return m[s] ?? 'badge-neutral';
  }

  durationLabel(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  }
}
