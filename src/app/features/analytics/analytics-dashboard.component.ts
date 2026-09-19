import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderService } from '../../core/services/order.service';
import { LoadService } from '../../core/services/load.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { DriverService } from '../../core/services/driver.service';
import { CarrierService } from '../../core/services/carrier.service';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Analytics</h1>
          <span class="header-subtitle">Operational performance overview</span>
        </div>
      </div>
      <div class="header-right">
        <button id="exportBtn" class="btn btn-sm btn-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export
        </button>
      </div>
    </header>
    <main class="page-container">

      <!-- Top KPI Row -->
      <div class="analytics-kpi-grid">
        @for (card of analyticsKpis(); track card.label) {
          <div class="panel analytics-kpi-card">
            <div class="kpi-value data-mono" style="font-size:26px;">{{ card.value }}</div>
            <div class="kpi-label">{{ card.label }}</div>
            <div class="kpi-sub">{{ card.sub }}</div>
          </div>
        }
      </div>

      <!-- Two-column charts row -->
      <div class="analytics-row">
        <!-- Order Status Breakdown -->
        <div class="panel" style="flex:1;">
          <div class="panel-header"><h2 class="panel-title">Order Status Breakdown</h2></div>
          <div class="panel-body">
            @for (item of orderBreakdown(); track item.label) {
              <div class="breakdown-row">
                <span class="breakdown-label">{{ item.label }}</span>
                <div class="breakdown-bar-wrap">
                  <div class="breakdown-bar">
                    <div class="breakdown-fill" [ngClass]="item.css" [style.width]="item.pct + '%'"></div>
                  </div>
                  <span class="breakdown-count data-mono">{{ item.count }}</span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Carrier Performance -->
        <div class="panel" style="flex:1;">
          <div class="panel-header"><h2 class="panel-title">Carrier Performance</h2></div>
          <div class="panel-body">
            @for (c of carrierService.carriers(); track c.id) {
              <div class="carrier-perf-row">
                <div class="carrier-perf-name">{{ c.name }}</div>
                <div class="carrier-perf-bar-group">
                  <div class="breakdown-bar">
                    <div class="breakdown-fill success-fill" [style.width]="(c.onTimeRate ?? 0) + '%'"></div>
                  </div>
                  <span class="breakdown-count data-mono">{{ c.onTimeRate ?? 0 }}%</span>
                </div>
                <span class="breakdown-label" style="font-size:11px;">{{ c.totalDeliveries ?? 0 }} deliveries</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Fleet Utilisation -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">Fleet Utilisation</h2>
          <span class="panel-count">{{ vehicleService.vehicles().length }} vehicles</span>
        </div>
        <div class="panel-body fleet-util-grid">
          @for (v of vehicleService.vehicles(); track v.id) {
            <div class="util-card">
              <div class="data-mono" style="font-size:12px;font-weight:600;color:var(--brand);">{{ v.registrationNumber }}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;">{{ v.type }}</div>
              @if (v.fuelLevel != null) {
                <div class="progress-bar">
                  <div class="progress-fill" [class]="fuelClass(v.fuelLevel)" [style.width]="v.fuelLevel + '%'"></div>
                </div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:3px;">{{ v.fuelLevel }}% fuel</div>
              }
              <div style="margin-top:8px;">
                <span class="badge" style="font-size:10px;" [ngClass]="vBadge(v.status)">{{ v.status }}</span>
              </div>
            </div>
          }
        </div>
      </div>

    </main>
  `,
  styles: [`
    :host { display:flex; flex-direction:column; height:100%; overflow:hidden; }
    .analytics-kpi-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:12px; }
    .analytics-kpi-card { padding:16px; }
    .analytics-row { display:flex; gap:16px; }
    .breakdown-row { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid var(--border-subtle); }
    .breakdown-row:last-child { border-bottom:none; }
    .breakdown-label { width:110px; font-size:12px; color:var(--text-secondary); flex-shrink:0; }
    .breakdown-bar-wrap { display:flex; align-items:center; gap:8px; flex:1; }
    .breakdown-bar { flex:1; height:8px; background:var(--border); border-radius:99px; overflow:hidden; }
    .breakdown-fill { height:100%; border-radius:99px; background:var(--brand); }
    .breakdown-fill.success-fill { background:var(--success); }
    .breakdown-fill.warning-fill { background:var(--warning); }
    .breakdown-fill.error-fill { background:var(--error); }
    .breakdown-fill.neutral-fill { background:var(--text-disabled); }
    .breakdown-count { font-size:12px; color:var(--text-muted); width:36px; text-align:right; }
    .carrier-perf-row { display:grid; grid-template-columns:120px 1fr auto; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid var(--border-subtle); }
    .carrier-perf-row:last-child { border-bottom:none; }
    .carrier-perf-name { font-size:12px; font-weight:600; }
    .carrier-perf-bar-group { display:flex; align-items:center; gap:8px; }
    .fleet-util-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(130px, 1fr)); gap:12px; }
    .util-card { border:1px solid var(--border); border-radius:var(--radius-md); padding:12px; }
  `]
})
export class AnalyticsDashboardComponent {
  readonly orderService   = inject(OrderService);
  readonly loadService    = inject(LoadService);
  readonly vehicleService = inject(VehicleService);
  readonly driverService  = inject(DriverService);
  readonly carrierService = inject(CarrierService);

  readonly analyticsKpis = computed(() => {
    const orders  = this.orderService.orders();
    const loads   = this.loadService.loads();
    const drivers = this.driverService.drivers();
    const total   = orders.length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const failed    = orders.filter(o => o.status === 'FAILED').length;
    const onTimePct = total > 0 ? Math.round(((total - failed) / total) * 100) : 0;

    return [
      { label: 'Total Orders',    value: total.toString(),                  sub: 'All time' },
      { label: 'Delivered',       value: delivered.toString(),               sub: 'Successfully completed' },
      { label: 'On-Time Rate',    value: onTimePct + '%',                   sub: 'Last 7 days' },
      { label: 'Failed Attempts', value: failed.toString(),                  sub: 'Requires review' },
      { label: 'Active Drivers',  value: drivers.filter(d => d.status !== 'OFFLINE').length.toString(), sub: 'Currently on shift' },
      { label: 'Active Loads',    value: loads.filter(l => l.status === 'IN_TRANSIT').length.toString(), sub: 'In transit' },
    ];
  });

  readonly orderBreakdown = computed(() => {
    const orders = this.orderService.orders();
    const total  = orders.length || 1;
    const statuses = [
      { label: 'Delivered',  css: 'success-fill', filter: 'DELIVERED' },
      { label: 'In Transit', css: '',             filter: 'IN_TRANSIT' },
      { label: 'Assigned',   css: '',             filter: 'ASSIGNED' },
      { label: 'Pending',    css: 'neutral-fill', filter: 'PENDING' },
      { label: 'Failed',     css: 'error-fill',   filter: 'FAILED' },
      { label: 'Cancelled',  css: 'neutral-fill', filter: 'CANCELLED' },
    ];
    return statuses.map(s => {
      const count = orders.filter(o => o.status === s.filter).length;
      return { ...s, count, pct: Math.round((count / total) * 100) };
    });
  });

  fuelClass(l: number): string {
    return l <= 20 ? 'error' : l <= 40 ? 'warning' : 'success';
  }

  vBadge(s: string): string {
    const m: Record<string, string> = {
      AVAILABLE:'badge-success', IN_TRANSIT:'badge-info',
      ASSIGNED:'badge-brand', MAINTENANCE:'badge-warning', OFFLINE:'badge-neutral'
    };
    return m[s] ?? 'badge-neutral';
  }
}
