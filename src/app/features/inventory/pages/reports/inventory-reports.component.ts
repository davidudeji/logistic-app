import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StockMovement } from '../../inventory.model';

type ReportTab = 'movement' | 'slow-moving' | 'shrinkage' | 'valuation';
type MovementType = 'RECEIPT' | 'DISPATCH' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';

@Component({
  selector: 'app-inventory-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    :host { font-family: 'Times New Roman', serif; display: block; }

    /* ── Layout ── */
    .page-wrapper { background: #fbfbfb; min-height: 100vh; }

    /* ── Sub-nav ── */
    .sub-nav {
      display: flex; gap: 0; border-bottom: 1px solid #e5e7eb;
      background: #fff; padding: 0 24px; overflow-x: auto;
    }
    .sub-nav a {
      display: inline-block; padding: 12px 16px; font-size: 13px;
      font-family: 'Times New Roman', serif; color: #555;
      text-decoration: none; border-bottom: 2px solid transparent;
      white-space: nowrap; transition: color .15s;
    }
    .sub-nav a:hover { color: #111; }
    .sub-nav a.active { color: #111; border-bottom-color: #111; font-weight: 600; }

    /* ── Page header ── */
    .page-header { padding: 28px 32px 0; }
    .page-header h1 { margin: 0 0 4px; font-size: 22px; font-weight: 700; color: #111; }
    .page-header p { margin: 0; font-size: 13px; color: #6b7280; }

    /* ── Tab selector ── */
    .tab-bar {
      display: flex; gap: 4px; padding: 20px 32px 0;
    }
    .tab-btn {
      padding: 8px 18px; border-radius: 6px; border: 1px solid #e5e7eb;
      background: #f3f4f6; color: #555; font-size: 13px;
      font-family: 'Times New Roman', serif; cursor: pointer; transition: all .15s;
    }
    .tab-btn:hover { background: #e9eaec; color: #111; }
    .tab-btn.active { background: #111; color: #fff; border-color: #111; }

    /* ── Content area ── */
    .content { padding: 20px 32px 40px; }

    /* ── Filter bar ── */
    .filter-bar {
      display: flex; flex-wrap: wrap; gap: 10px;
      align-items: center; margin-bottom: 16px;
    }
    .filter-bar input, .filter-bar select {
      padding: 7px 10px; border: 1px solid #e5e7eb; border-radius: 5px;
      font-size: 13px; font-family: 'Times New Roman', serif;
      background: #fff; color: #111; outline: none;
    }
    .filter-bar input:focus, .filter-bar select:focus { border-color: #aaa; }
    .export-btn {
      margin-left: auto; padding: 7px 16px; background: #111; color: #fff;
      border: none; border-radius: 5px; font-size: 13px;
      font-family: 'Times New Roman', serif; cursor: pointer;
    }
    .export-btn:hover { background: #333; }

    /* ── Table ── */
    .table-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 7px; background: #fff; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      background: #f9fafb; padding: 10px 12px; text-align: left;
      font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; color: #111; vertical-align: middle; }
    tbody tr:last-child td { border-bottom: none; }
    tbody tr:hover td { background: #f9fafb; }

    /* ── Movement type badges ── */
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      font-size: 11px; font-weight: 600; white-space: nowrap;
    }
    .badge-RECEIPT    { background: #dcfce7; color: #16a34a; }
    .badge-DISPATCH   { background: #fee2e2; color: #dc2626; }
    .badge-ADJUSTMENT { background: #ede9fe; color: #7c3aed; }
    .badge-TRANSFER   { background: #dbeafe; color: #2563eb; }
    .badge-RETURN     { background: #fef3c7; color: #d97706; }

    .qty-green { color: #16a34a; font-weight: 600; }
    .qty-red   { color: #dc2626; font-weight: 600; }

    /* ── Pagination ── */
    .pagination {
      display: flex; justify-content: flex-end; align-items: center;
      gap: 10px; margin-top: 12px; font-size: 13px; color: #555;
    }
    .pagination button {
      padding: 5px 12px; border: 1px solid #e5e7eb; border-radius: 5px;
      background: #fff; cursor: pointer; font-size: 13px;
      font-family: 'Times New Roman', serif;
    }
    .pagination button:disabled { opacity: .4; cursor: default; }
    .pagination button:not(:disabled):hover { background: #f3f4f6; }

    /* ── Summary cards ── */
    .summary-banner {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 7px;
      padding: 14px 18px; margin-bottom: 16px; font-size: 13px; color: #374151;
    }
    .summary-banner strong { color: #111; }

    .cards-row { display: flex; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
    .card {
      flex: 1; min-width: 160px; background: #fff;
      border: 1px solid #e5e7eb; border-radius: 7px; padding: 16px 18px;
    }
    .card .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .card .value { font-size: 20px; font-weight: 700; color: #111; }

    /* ── Value bar ── */
    .value-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .value-bar { height: 6px; border-radius: 3px; background: #111; min-width: 2px; }

    /* ── Group table ── */
    .group-heading {
      font-size: 14px; font-weight: 700; color: #111;
      margin: 28px 0 10px; padding-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
    }

    .empty-row td { text-align: center; color: #9ca3af; padding: 28px 12px; }
  `],
  template: `
    <div class="page-wrapper">

      <!-- ── Sub-nav ───────────────────────────────── -->
      <nav class="sub-nav">
        <a routerLink="/inventory"                  routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Stock Master</a>
        <a routerLink="/inventory/grn"              routerLinkActive="active">Receiving (GRN)</a>
        <a routerLink="/inventory/dispatch-orders"  routerLinkActive="active">Dispatch Orders</a>
        <a routerLink="/inventory/transfer"         routerLinkActive="active">Transfer</a>
        <a routerLink="/inventory/adjustments"      routerLinkActive="active">Adjustments</a>
        <a routerLink="/inventory/alerts"           routerLinkActive="active">Alerts</a>
        <a routerLink="/inventory/reports"          routerLinkActive="active">Reports</a>
      </nav>

      <!-- ── Page header ───────────────────────────── -->
      <div class="page-header">
        <h1>Inventory Reports</h1>
        <p>Movement history, slow-movers, shrinkage and stock value</p>
      </div>

      <!-- ── Report tabs ────────────────────────────── -->
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="activeTab()==='movement'"    (click)="activeTab.set('movement')">Movement History</button>
        <button class="tab-btn" [class.active]="activeTab()==='slow-moving'" (click)="activeTab.set('slow-moving')">Slow-Moving Stock</button>
        <button class="tab-btn" [class.active]="activeTab()==='shrinkage'"   (click)="activeTab.set('shrinkage')">Shrinkage Report</button>
        <button class="tab-btn" [class.active]="activeTab()==='valuation'"   (click)="activeTab.set('valuation')">Stock Valuation</button>
      </div>

      <div class="content">

        <!-- ════════════════════════════════════════════
             TAB 1 — Movement History
             ════════════════════════════════════════════ -->
        @if (activeTab() === 'movement') {
          <div class="filter-bar">
            <input type="date" [(ngModel)]="mvFilter.dateFrom"  (ngModelChange)="mvPage.set(1)" placeholder="Date From" />
            <input type="date" [(ngModel)]="mvFilter.dateTo"    (ngModelChange)="mvPage.set(1)" placeholder="Date To" />
            <select [(ngModel)]="mvFilter.itemId" (ngModelChange)="mvPage.set(1)">
              <option value="">All Items</option>
              @for (item of inventorySvc.items(); track item.id) {
                <option [value]="item.id">{{ item.name }}</option>
              }
            </select>
            <select [(ngModel)]="mvFilter.warehouseId" (ngModelChange)="mvPage.set(1)">
              <option value="">All Warehouses</option>
              @for (wh of inventorySvc.warehouses; track wh.id) {
                <option [value]="wh.id">{{ wh.name }}</option>
              }
            </select>
            <select [(ngModel)]="mvFilter.type" (ngModelChange)="mvPage.set(1)">
              <option value="">All Types</option>
              <option value="RECEIPT">RECEIPT</option>
              <option value="DISPATCH">DISPATCH</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="RETURN">RETURN</option>
            </select>
            <button class="export-btn" (click)="exportMovementCsv()">Export CSV</button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Warehouse</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Reference</th>
                  <th>Performed By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                @if (mvPageRows().length === 0) {
                  <tr class="empty-row"><td colspan="9">No movements match the selected filters.</td></tr>
                }
                @for (row of mvPageRows(); track row.id) {
                  <tr>
                    <td>{{ formatDate(row.createdAt) }}</td>
                    <td>{{ itemName(row.itemId) }}</td>
                    <td>{{ itemSku(row.itemId) }}</td>
                    <td>{{ warehouseName(row.warehouseId) }}</td>
                    <td><span class="badge badge-{{row.type}}">{{ row.type }}</span></td>
                    <td [class.qty-red]="row.type==='DISPATCH'" [class.qty-green]="row.type==='RECEIPT'||row.type==='RETURN'">
                      {{ qtyDisplay(row) }}
                    </td>
                    <td>{{ row.reference }}</td>
                    <td>{{ row.performedBy }}</td>
                    <td>{{ row.notes || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="pagination">
            <span>Showing {{ mvRangeStart() }}–{{ mvRangeEnd() }} of {{ mvFiltered().length }}</span>
            <button [disabled]="mvPage() === 1" (click)="mvPage.set(mvPage()-1)">Previous</button>
            <button [disabled]="mvPage() >= mvTotalPages()" (click)="mvPage.set(mvPage()+1)">Next</button>
          </div>
        }

        <!-- ════════════════════════════════════════════
             TAB 2 — Slow-Moving Stock
             ════════════════════════════════════════════ -->
        @if (activeTab() === 'slow-moving') {
          <div class="summary-banner">
            <strong>{{ slowMovers().length }}</strong> items have had no outbound movement in 90+ days.
            Total value at risk: <strong>₦{{ formatNaira(slowMoverTotalValue()) }}</strong>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>On Hand</th>
                  <th>Last Dispatch Date</th>
                  <th>Days Idle</th>
                  <th>Unit Cost (₦)</th>
                  <th>Total Value (₦)</th>
                </tr>
              </thead>
              <tbody>
                @if (slowMovers().length === 0) {
                  <tr class="empty-row"><td colspan="8">No slow-moving items found.</td></tr>
                }
                @for (row of slowMovers(); track row.itemId) {
                  <tr>
                    <td>{{ row.name }}</td>
                    <td>{{ row.sku }}</td>
                    <td>{{ row.category }}</td>
                    <td>{{ row.onHand }}</td>
                    <td>{{ row.lastDispatch }}</td>
                    <td>{{ row.daysIdle }}</td>
                    <td>{{ formatNaira(row.unitCost) }}</td>
                    <td>{{ formatNaira(row.totalValue) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ════════════════════════════════════════════
             TAB 3 — Shrinkage Report
             ════════════════════════════════════════════ -->
        @if (activeTab() === 'shrinkage') {
          <div class="cards-row">
            <div class="card">
              <div class="label">Total Shrinkage Units</div>
              <div class="value">{{ shrinkageTotals().units }}</div>
            </div>
            <div class="card">
              <div class="label">Total Shrinkage Value</div>
              <div class="value">₦{{ formatNaira(shrinkageTotals().value) }}</div>
            </div>
            <div class="card">
              <div class="label">Most Common Reason</div>
              <div class="value" style="font-size:15px">{{ shrinkageTotals().topReason }}</div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Reason</th>
                  <th>Qty Lost</th>
                  <th>Value Lost (₦)</th>
                  <th>Performed By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                @if (shrinkageRows().length === 0) {
                  <tr class="empty-row"><td colspan="7">No shrinkage records found.</td></tr>
                }
                @for (row of shrinkageRows(); track row.id) {
                  <tr>
                    <td>{{ formatDate(row.createdAt) }}</td>
                    <td>{{ itemName(row.itemId) }}</td>
                    <td>{{ row.adjustmentReason || row.reason || '—' }}</td>
                    <td class="qty-red">{{ Math.abs(row.quantity) }}</td>
                    <td>{{ formatNaira(itemUnitCost(row.itemId) * Math.abs(row.quantity)) }}</td>
                    <td>{{ row.performedBy }}</td>
                    <td>{{ row.notes || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Group by reason -->
          <div class="group-heading">Shrinkage by Reason</div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>Count</th>
                  <th>Total Units</th>
                  <th>Total Value (₦)</th>
                </tr>
              </thead>
              <tbody>
                @if (shrinkageByReason().length === 0) {
                  <tr class="empty-row"><td colspan="4">No data.</td></tr>
                }
                @for (grp of shrinkageByReason(); track grp.reason) {
                  <tr>
                    <td>{{ grp.reason }}</td>
                    <td>{{ grp.count }}</td>
                    <td>{{ grp.units }}</td>
                    <td>{{ formatNaira(grp.value) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

        <!-- ════════════════════════════════════════════
             TAB 4 — Stock Valuation
             ════════════════════════════════════════════ -->
        @if (activeTab() === 'valuation') {
          <div class="cards-row">
            <div class="card">
              <div class="label">Total Portfolio Value</div>
              <div class="value">₦{{ formatNaira(valuationTotals().total) }}</div>
            </div>
            <div class="card">
              <div class="label">Total Items</div>
              <div class="value">{{ valuationTotals().count }}</div>
            </div>
            <div class="card">
              <div class="label">Average Unit Cost</div>
              <div class="value">₦{{ formatNaira(valuationTotals().avgCost) }}</div>
            </div>
          </div>

          <div class="filter-bar">
            <button class="export-btn" (click)="exportValuationCsv()">Export CSV</button>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>UoM</th>
                  <th>On Hand</th>
                  <th>Unit Cost (₦)</th>
                  <th>Total Value (₦)</th>
                  <th>% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                @if (valuationRows().length === 0) {
                  <tr class="empty-row"><td colspan="8">No stock data available.</td></tr>
                }
                @for (row of valuationRows(); track row.itemId) {
                  <tr>
                    <td>{{ row.name }}</td>
                    <td>{{ row.sku }}</td>
                    <td>{{ row.category }}</td>
                    <td>{{ row.uom }}</td>
                    <td>{{ row.onHand }}</td>
                    <td>{{ formatNaira(row.unitCost) }}</td>
                    <td>
                      <div class="value-bar-wrap">
                        <span>{{ formatNaira(row.totalValue) }}</span>
                        <div class="value-bar" [style.width.px]="barWidth(row.totalValue)"></div>
                      </div>
                    </td>
                    <td>{{ row.pct.toFixed(1) }}%</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div><!-- /content -->
    </div><!-- /page-wrapper -->
  `,
})
export class InventoryReportsComponent {
  protected readonly Math = Math;

  private readonly toast = inject(ToastService);
  protected readonly inventorySvc = inject(InventoryService);

  // ── Active tab ───────────────────────────────────────────────────────────────
  activeTab = signal<ReportTab>('movement');

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1 — Movement History
  // ═══════════════════════════════════════════════════════════════════════════
  mvFilter = { dateFrom: '', dateTo: '', itemId: '', warehouseId: '', type: '' };
  mvPage = signal(1);
  readonly PAGE_SIZE = 20;

  mvFiltered = computed(() => {
    const { dateFrom, dateTo, itemId, warehouseId, type } = this.mvFilter;
    return this.inventorySvc.movements().filter(m => {
      if (dateFrom && m.createdAt < dateFrom) return false;
      if (dateTo   && m.createdAt > dateTo + 'T23:59:59') return false;
      if (itemId      && m.itemId      !== itemId)      return false;
      if (warehouseId && m.warehouseId !== warehouseId) return false;
      if (type        && m.type        !== type)        return false;
      return true;
    });
  });

  mvTotalPages = computed(() => Math.max(1, Math.ceil(this.mvFiltered().length / this.PAGE_SIZE)));
  mvRangeStart = computed(() => this.mvFiltered().length === 0 ? 0 : (this.mvPage() - 1) * this.PAGE_SIZE + 1);
  mvRangeEnd   = computed(() => Math.min(this.mvPage() * this.PAGE_SIZE, this.mvFiltered().length));

  mvPageRows = computed(() => {
    const start = (this.mvPage() - 1) * this.PAGE_SIZE;
    return this.mvFiltered().slice(start, start + this.PAGE_SIZE);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2 — Slow-Moving Stock
  // ═══════════════════════════════════════════════════════════════════════════
  slowMovers = computed(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const cutoff = ninetyDaysAgo.toISOString();

    const dispatches = this.inventorySvc.movements().filter(m => m.type === 'DISPATCH');

    return this.inventorySvc.items()
      .map(item => {
        const itemDispatches = dispatches.filter(d => d.itemId === item.id);
        const recentDispatch = itemDispatches.filter(d => d.createdAt >= cutoff);

        // Only include if no recent dispatch
        if (recentDispatch.length > 0) return null;

        const lastDispatchRecord = itemDispatches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
        const onHand = this.onHandForItem(item.id);
        const daysIdle = lastDispatchRecord
          ? Math.floor((Date.now() - new Date(lastDispatchRecord.createdAt).getTime()) / 86400000)
          : null;

        return {
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          onHand,
          lastDispatch: lastDispatchRecord ? this.formatDate(lastDispatchRecord.createdAt) : 'Never dispatched',
          daysIdle: daysIdle !== null ? daysIdle : '∞',
          unitCost: item.unitCostNaira,
          totalValue: onHand * item.unitCostNaira,
          _daysIdle: daysIdle ?? 999999,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b._daysIdle - a._daysIdle);
  });

  slowMoverTotalValue = computed(() =>
    this.slowMovers().reduce((sum, r) => sum + r.totalValue, 0)
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3 — Shrinkage Report
  // ═══════════════════════════════════════════════════════════════════════════
  shrinkageRows = computed(() =>
    this.inventorySvc.movements().filter(
      m => m.type === 'ADJUSTMENT' && m.quantity < 0
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  shrinkageTotals = computed(() => {
    const rows = this.shrinkageRows();
    const units = rows.reduce((s, r) => s + Math.abs(r.quantity), 0);
    const value = rows.reduce((s, r) => s + this.itemUnitCost(r.itemId) * Math.abs(r.quantity), 0);

    // Count by reason
    const reasonCount: Record<string, number> = {};
    rows.forEach(r => {
      const key = r.adjustmentReason || (r as any).reason || 'Unknown';
      reasonCount[key] = (reasonCount[key] ?? 0) + 1;
    });
    const topReason = Object.entries(reasonCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { units, value, topReason };
  });

  shrinkageByReason = computed(() => {
    const map: Record<string, { count: number; units: number; value: number }> = {};
    this.shrinkageRows().forEach(r => {
      const key = r.adjustmentReason || r.reason || 'Unknown';
      if (!map[key]) map[key] = { count: 0, units: 0, value: 0 };
      map[key].count++;
      map[key].units  += Math.abs(r.quantity);
      map[key].value  += this.itemUnitCost(r.itemId) * Math.abs(r.quantity);
    });
    return Object.entries(map)
      .map(([reason, v]) => ({ reason, ...v }))
      .sort((a, b) => b.units - a.units);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4 — Stock Valuation
  // ═══════════════════════════════════════════════════════════════════════════
  valuationRows = computed(() => {
    const total = this.valuationTotals().total || 1;
    return this.inventorySvc.items()
      .map(item => {
        const onHand = this.onHandForItem(item.id);
        const totalValue = onHand * item.unitCostNaira;
        return {
          itemId: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          uom: item.unitOfMeasure,
          onHand,
          unitCost: item.unitCostNaira,
          totalValue,
          pct: (totalValue / total) * 100,
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue);
  });

  valuationTotals = computed(() => {
    const items = this.inventorySvc.items();
    const total = items.reduce((s, item) => s + this.onHandForItem(item.id) * item.unitCostNaira, 0);
    const count = items.length;
    const avgCost = count > 0 ? items.reduce((s, i) => s + i.unitCostNaira, 0) / count : 0;
    return { total, count, avgCost };
  });

  maxValuationValue = computed(() =>
    Math.max(1, ...this.valuationRows().map(r => r.totalValue))
  );

  barWidth(val: number): number {
    return Math.round((val / this.maxValuationValue()) * 80);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helper look-ups
  // ═══════════════════════════════════════════════════════════════════════════
  itemName(itemId: string): string {
    return this.inventorySvc.items().find(i => i.id === itemId)?.name ?? itemId;
  }

  itemSku(itemId: string): string {
    return this.inventorySvc.items().find(i => i.id === itemId)?.sku ?? '—';
  }

  itemUnitCost(itemId: string): number {
    return this.inventorySvc.items().find(i => i.id === itemId)?.unitCostNaira ?? 0;
  }

  warehouseName(whId: string): string {
    return this.inventorySvc.warehouses.find(w => w.id === whId)?.name ?? whId;
  }

  onHandForItem(itemId: string): number {
    return this.inventorySvc.stockLevels()
      .filter(sl => sl.itemId === itemId)
      .reduce((s, sl) => s + sl.onHand, 0);
  }

  qtyDisplay(m: StockMovement): string {
    if (m.type === 'DISPATCH') return `-${Math.abs(m.quantity)}`;
    if (m.type === 'RECEIPT' || m.type === 'RETURN') return `+${m.quantity}`;
    return String(m.quantity);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Formatting helpers
  // ═══════════════════════════════════════════════════════════════════════════
  formatNaira(value: number): string {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000)     return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)         return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString('en-NG');
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CSV Exports
  // ═══════════════════════════════════════════════════════════════════════════
  exportMovementCsv(): void {
    const rows = this.mvFiltered();
    const header = ['Date', 'Item Name', 'SKU', 'Warehouse', 'Type', 'Qty', 'Reference', 'Performed By', 'Notes'];
    const lines = rows.map(r => [
      this.formatDate(r.createdAt),
      this.csvEscape(this.itemName(r.itemId)),
      this.itemSku(r.itemId),
      this.csvEscape(this.warehouseName(r.warehouseId)),
      r.type,
      this.qtyDisplay(r),
      this.csvEscape(r.reference ?? ''),
      this.csvEscape(r.performedBy ?? ''),
      this.csvEscape(r.notes ?? ''),
    ].join(','));

    this.downloadCsv([header.join(','), ...lines].join('\n'), 'movement-history.csv');
  }

  exportValuationCsv(): void {
    const rows = this.valuationRows();
    const header = ['Item Name', 'SKU', 'Category', 'UoM', 'On Hand', 'Unit Cost (NGN)', 'Total Value (NGN)', '% of Portfolio'];
    const lines = rows.map(r => [
      this.csvEscape(r.name),
      r.sku,
      r.category,
      r.uom,
      r.onHand,
      r.unitCost,
      r.totalValue,
      r.pct.toFixed(1) + '%',
    ].join(','));

    this.downloadCsv([header.join(','), ...lines].join('\n'), 'stock-valuation.csv');
  }

  private csvEscape(val: string): string {
    if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
    return val;
  }

  private downloadCsv(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show(`${filename} downloaded`, 'success');
  }
}
