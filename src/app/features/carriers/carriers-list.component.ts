import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarrierService } from '../../core/services/carrier.service';

@Component({
  selector: 'app-carriers-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Carriers</h1>
          <span class="header-subtitle">Manage logistics providers and fleet types</span>
        </div>
      </div>
      <div class="header-right">
        <button id="addCarrierBtn" class="btn btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Carrier
        </button>
      </div>
    </header>
    <main class="page-container">
      <div class="carriers-grid">
        @for (carrier of carrierService.carriers(); track carrier.id) {
          <div class="panel carrier-card">
            <div class="carrier-header">
              <div>
                <div class="carrier-name">{{ carrier.name }}</div>
                <span class="badge" [ngClass]="typeBadge(carrier.type)">{{ typeLabel(carrier.type) }}</span>
              </div>
              <span class="badge" [ngClass]="carrier.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'">
                {{ carrier.status }}
              </span>
            </div>
            <div class="carrier-metrics">
              <div class="metric"><div class="metric-val data-mono">{{ carrier.onTimeRate ?? '—' }}%</div><div class="metric-lbl">On-Time Rate</div></div>
              <div class="metric"><div class="metric-val data-mono">{{ carrier.failureRate ?? '—' }}%</div><div class="metric-lbl">Failure Rate</div></div>
              <div class="metric"><div class="metric-val data-mono">{{ carrier.activeLoads ?? 0 }}</div><div class="metric-lbl">Active Loads</div></div>
              <div class="metric"><div class="metric-val data-mono">{{ carrier.totalDeliveries ?? 0 }}</div><div class="metric-lbl">Total Deliveries</div></div>
            </div>
            @if (carrier.costPerKm != null) {
              <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">
                ₦{{ carrier.costPerKm }}/km
              </div>
            }
          </div>
        }
      </div>
    </main>
  `,
  styles: [`
    .carriers-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
    .carrier-card { padding:20px; }
    .carrier-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
    .carrier-name { font-size:15px; font-weight:700; margin-bottom:6px; }
    .carrier-metrics { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .metric { }
    .metric-val { font-size:20px; font-weight:700; color:var(--text-primary); }
    .metric-lbl { font-size:11px; color:var(--text-muted); margin-top:2px; }
  `]
})
export class CarriersListComponent {
  readonly carrierService = inject(CarrierService);

  typeBadge(t: string): string {
    const m: Record<string, string> = {
      OWN_FLEET: 'badge-brand', THIRD_PARTY: 'badge-info', PARCEL: 'badge-neutral', INDEPENDENT: 'badge-warning'
    };
    return m[t] ?? 'badge-neutral';
  }

  typeLabel(t: string): string {
    const m: Record<string, string> = {
      OWN_FLEET: 'Own Fleet', THIRD_PARTY: '3PL', PARCEL: 'Parcel', INDEPENDENT: 'Independent'
    };
    return m[t] ?? t;
  }
}
