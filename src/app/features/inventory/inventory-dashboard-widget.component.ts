import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InventoryService } from './inventory.service';

@Component({
  selector: 'app-inventory-dashboard-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="inv-widget">
  <div class="inv-widget-header">
    <div class="inv-widget-title-group">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
      <span class="inv-widget-title">Inventory</span>
    </div>
    <a routerLink="/inventory" class="inv-widget-link">View All</a>
  </div>
  <div class="inv-widget-grid">
    <div class="inv-widget-stat">
      <div class="inv-widget-stat-value">{{ kpi().totalItems }}</div>
      <div class="inv-widget-stat-label">Total Items</div>
    </div>
    <div class="inv-widget-stat" [class.stat-alert]="kpi().lowStockCount > 0">
      <div class="inv-widget-stat-value" [style.color]="kpi().lowStockCount > 0 ? '#dc2626' : 'inherit'">
        {{ kpi().lowStockCount }}
      </div>
      <div class="inv-widget-stat-label">Low Stock</div>
    </div>
    <div class="inv-widget-stat">
      <div class="inv-widget-stat-value">{{ kpi().inTransitCount }}</div>
      <div class="inv-widget-stat-label">In Transit</div>
    </div>
    <div class="inv-widget-stat">
      <div class="inv-widget-stat-value">₦{{ formatNaira(kpi().totalValueNaira) }}</div>
      <div class="inv-widget-stat-label">Stock Value</div>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; }

    .inv-widget {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px;
    }
    .inv-widget-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    }
    .inv-widget-title-group { display: flex; align-items: center; gap: 7px; color: #374151; }
    .inv-widget-title { font-size: 13px; font-weight: 700; color: #111; }
    .inv-widget-link {
      font-size: 11px; color: #6b7280; text-decoration: none; font-weight: 500;
      border: 1px solid #e5e7eb; border-radius: 4px; padding: 3px 8px;
      transition: background 0.15s;
    }
    .inv-widget-link:hover { background: #f9fafb; color: #111; }

    .inv-widget-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .inv-widget-stat {
      text-align: center; padding: 8px 4px; border-radius: 6px; background: #f9fafb;
      border: 1px solid #f3f4f6;
    }
    .stat-alert { background: #fef2f2; border-color: #fecaca; }
    .inv-widget-stat-value { font-size: 16px; font-weight: 700; color: #111; line-height: 1.1; }
    .inv-widget-stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  `],
})
export class InventoryDashboardWidgetComponent {
  private readonly inventoryService = inject(InventoryService);

  readonly kpi = this.inventoryService.getDashboardKpi;

  formatNaira(value: number): string {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toLocaleString('en-NG');
  }
}
