import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExceptionService } from '../../core/services/exception.service';
import {
  exceptionSeverityBadge, exceptionStatusBadge,
  exceptionTypeLabel
} from '../../shared/utils/status.utils';

function statusLabel(s: string): string {
  const m: Record<string, string> = { OPEN: 'Open', ACKNOWLEDGED: 'Acknowledged', RESOLVED: 'Resolved' };
  return m[s] ?? s;
}

@Component({
  selector: 'app-exceptions-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Exception Center</h1>
          <span class="header-subtitle">{{ openCount() }} open · {{ criticalCount() }} critical</span>
        </div>
      </div>
      <div class="header-right">
        <div class="severity-filter">
          @for (f of filters; track f.value) {
            <button class="btn btn-sm" [ngClass]="activeFilter() === f.value ? 'btn-primary' : 'btn-secondary'"
                    (click)="activeFilter.set(f.value)" [id]="'filter-' + f.value">
              {{ f.label }}
            </button>
          }
        </div>
      </div>
    </header>
    <main class="page-container">
      <div class="exc-full-list">
        @for (exc of filtered(); track exc.id) {
          <div class="panel exc-full-card" [class]="'exc-border-' + exc.severity.toLowerCase()">
            <div class="exc-card-left">
              <span class="badge" [ngClass]="exceptionSeverityBadge(exc.severity)">{{ exc.severity }}</span>
              <div class="exc-type-full">{{ exceptionTypeLabel(exc.type) }}</div>
              <div class="exc-id-row">
                <span class="data-mono" style="font-size:11px;color:var(--text-muted);">
                  {{ [exc.loadId, exc.vehicleId, exc.orderId, exc.driverId].filter(v => !!v).join(' · ') }}
                </span>
              </div>
            </div>
            <div class="exc-card-body">
              <div class="exc-desc-full">{{ exc.description }}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:6px;">
                {{ exc.createdAt | date:'d MMM yyyy, HH:mm' }}
                @if (exc.assignedTo) { · Assigned: {{ exc.assignedTo }} }
              </div>
            </div>
            <div class="exc-card-actions">
              <span class="badge" [ngClass]="exceptionStatusBadge(exc.status)">{{ statusLabel(exc.status) }}</span>
              <div style="display:flex;gap:6px;margin-top:8px;">
                @if (exc.status === 'OPEN') {
                  <button class="btn btn-xs btn-secondary" (click)="acknowledge(exc.id)" [id]="'ack-' + exc.id">Acknowledge</button>
                }
                @if (exc.status !== 'RESOLVED') {
                  <button class="btn btn-xs btn-secondary" (click)="resolve(exc.id)" [id]="'res-' + exc.id">Resolve</button>
                }
              </div>
            </div>
          </div>
        }
        @if (filtered().length === 0) {
          <div class="state-container" style="padding:80px;">
            <svg class="state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <div class="state-title">No exceptions</div>
            <div class="state-desc">All clear for the selected filter.</div>
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .severity-filter { display:flex; gap:6px; }
    .exc-full-list { display:flex; flex-direction:column; gap:12px; }
    .exc-full-card {
      display:grid; grid-template-columns:200px 1fr auto;
      gap:16px; padding:16px 20px; align-items:start;
      border-left:3px solid var(--border);
    }
    .exc-border-critical { border-left-color:var(--error); }
    .exc-border-high { border-left-color:#F97316; }
    .exc-border-medium { border-left-color:var(--warning); }
    .exc-border-low { border-left-color:var(--text-disabled); }
    .exc-type-full { font-size:14px; font-weight:600; margin-top:6px; }
    .exc-desc-full { font-size:13px; color:var(--text-secondary); line-height:1.5; }
    .exc-card-actions { display:flex; flex-direction:column; align-items:flex-end; min-width:140px; }
  `]
})
export class ExceptionsListComponent {
  private excService = inject(ExceptionService);

  readonly exceptionSeverityBadge = exceptionSeverityBadge;
  readonly exceptionStatusBadge   = exceptionStatusBadge;
  readonly exceptionTypeLabel     = exceptionTypeLabel;
  readonly statusLabel            = statusLabel;

  readonly activeFilter = signal('ALL');
  readonly filters = [
    { label: 'All', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Resolved', value: 'RESOLVED' },
  ];

  readonly filtered = computed(() => {
    const f = this.activeFilter();
    const all = this.excService.exceptions();
    if (f === 'ALL')      return all;
    if (f === 'OPEN')     return all.filter(e => e.status !== 'RESOLVED');
    if (f === 'RESOLVED') return all.filter(e => e.status === 'RESOLVED');
    return all.filter(e => e.severity === f);
  });

  readonly openCount     = computed(() => this.excService.exceptions().filter(e => e.status !== 'RESOLVED').length);
  readonly criticalCount = computed(() => this.excService.exceptions().filter(e => e.severity === 'CRITICAL').length);

  acknowledge(id: string) { this.excService.acknowledge(id, 'Dispatcher').subscribe(); }
  resolve(id: string)     { this.excService.resolve(id).subscribe(); }
}
