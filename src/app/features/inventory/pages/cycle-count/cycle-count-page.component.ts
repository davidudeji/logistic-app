import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InventoryItem, StockLevel, StockMovement } from '../../inventory.model';

// ─── Internal view-model for a count row ─────────────────────────────────────
interface CountRow {
  item: InventoryItem;
  stockLevel: StockLevel;
  systemQty: number;
  physicalQty: number;
  note: string;
}

type Step = 'SETUP' | 'COUNT';

@Component({
  selector: 'app-cycle-count-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; color: #111; background: #fbfbfb; }

    .page-header { padding: 24px 28px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
    .page-title  { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #6b7280; margin: 0; }

    /* Sub-nav */
    .sub-nav { display: flex; gap: 4px; padding: 0 28px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
    .sub-nav-link { padding: 10px 14px; font-size: 13px; font-family: 'Times New Roman', serif; text-decoration: none; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color .15s; }
    .sub-nav-link:hover { color: #111; }
    .sub-nav-active { color: #111; border-bottom-color: #111; font-weight: 600; }

    .content { padding: 0 28px 40px; }

    /* Step indicator */
    .step-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .step-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; border: 1.5px solid #e5e7eb; color: #9ca3af; background: #f9fafb; }
    .step-pill.active { background: #111; color: #fff; border-color: #111; }
    .step-pill.done   { background: #dcfce7; color: #16a34a; border-color: #bbf7d0; }
    .step-sep { width: 24px; height: 1px; background: #d1d5db; }

    /* Form card */
    .form-card        { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 28px; max-width: 600px; }
    .form-card-header { padding: 14px 18px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .form-card-title  { font-size: 15px; font-weight: 700; margin: 0; }
    .form-card-body   { padding: 20px 18px; display: flex; flex-direction: column; gap: 14px; }

    .field-row   { display: flex; gap: 14px; flex-wrap: wrap; }
    .field-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 180px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    .field-input,
    .field-select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; font-family: 'Times New Roman', serif; font-size: 13px; width: 100%; box-sizing: border-box; background: #fff; color: #111; }
    .field-input:focus,
    .field-select:focus { outline: none; border-color: #111; }

    .error-msg { font-size: 12px; color: #dc2626; padding: 2px 0; }

    .btn-row       { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-primary   { background: #111; color: #fff; border: none; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .btn-primary:disabled             { opacity: .45; cursor: default; }
    .btn-primary:not(:disabled):hover { background: #333; }
    .btn-secondary { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; transition: background .15s; }
    .btn-secondary:hover { background: #f9fafb; }
    .btn-success   { background: #16a34a; color: #fff; border: none; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .btn-success:hover { background: #15803d; }

    /* Count table */
    .table-wrapper { overflow-x: auto; margin-bottom: 20px; }
    .count-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .count-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    .count-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: middle; }
    .count-table tr:last-child td { border-bottom: none; }
    .count-table tr:hover td { background: #f9fafb; }

    .qty-input { border: 1px solid #e5e7eb; border-radius: 5px; padding: 5px 8px; font-family: 'Times New Roman', serif; font-size: 13px; width: 80px; box-sizing: border-box; text-align: right; }
    .qty-input:focus { outline: none; border-color: #111; }

    .note-input { border: 1px solid #e5e7eb; border-radius: 5px; padding: 5px 8px; font-family: 'Times New Roman', serif; font-size: 12px; width: 140px; box-sizing: border-box; }
    .note-input:focus { outline: none; border-color: #111; }

    /* Variance badge */
    .badge { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; min-width: 44px; justify-content: center; }
    .badge-match { background: #dcfce7; color: #16a34a; }
    .badge-pos   { background: #dbeafe; color: #1d4ed8; }
    .badge-neg   { background: #fee2e2; color: #dc2626; }

    /* Summary bar */
    .summary-bar { display: flex; align-items: center; gap: 20px; padding: 12px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .summary-stat { font-size: 13px; color: #374151; }
    .summary-stat strong { color: #111; }

    .meta-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; padding: 12px 16px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    .meta-item { font-size: 12px; color: #6b7280; }
    .meta-item strong { color: #111; }

    .empty-state { color: #9ca3af; font-size: 13px; padding: 20px 0; text-align: center; }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">Cycle Count</h1>
      <p class="page-sub">Perform a physical inventory count and reconcile variances</p>
    </div>

    <!-- Sub-nav -->
    <nav class="sub-nav">
      <a class="sub-nav-link" routerLink="/inventory"                  routerLinkActive="sub-nav-active" [routerLinkActiveOptions]="{exact:true}">Stock Master</a>
      <a class="sub-nav-link" routerLink="/inventory/grn"              routerLinkActive="sub-nav-active">Receiving (GRN)</a>
      <a class="sub-nav-link" routerLink="/inventory/dispatch-orders"  routerLinkActive="sub-nav-active">Dispatch Orders</a>
      <a class="sub-nav-link" routerLink="/inventory/transfer"         routerLinkActive="sub-nav-active">Transfer</a>
      <a class="sub-nav-link" routerLink="/inventory/adjustments"      routerLinkActive="sub-nav-active">Adjustments</a>
      <a class="sub-nav-link" routerLink="/inventory/alerts"           routerLinkActive="sub-nav-active">Alerts</a>
      <a class="sub-nav-link" routerLink="/inventory/reports"          routerLinkActive="sub-nav-active">Reports</a>
    </nav>

    <div class="content">

      <!-- Step indicator -->
      <div class="step-bar">
        <span class="step-pill" [class.active]="step() === 'SETUP'" [class.done]="step() === 'COUNT'">
          1&nbsp; Setup
        </span>
        <div class="step-sep"></div>
        <span class="step-pill" [class.active]="step() === 'COUNT'">
          2&nbsp; Count Entry
        </span>
      </div>

      <!-- ── STEP 1: Setup ─────────────────────────────────────────────────── -->
      @if (step() === 'SETUP') {
        <div class="form-card">
          <div class="form-card-header">
            <div class="form-card-title">Count Setup</div>
          </div>
          <div class="form-card-body">

            <div class="field-group">
              <label class="field-label">Warehouse</label>
              <select class="field-select" [(ngModel)]="warehouseIdVal" (ngModelChange)="warehouseId.set($event)">
                <option value="">— Select warehouse —</option>
                @for (wh of inventorySvc.warehouses; track wh.id) {
                  <option [value]="wh.id">{{ wh.name }} — {{ wh.city }}</option>
                }
              </select>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label class="field-label">Count Reference</label>
                <input class="field-input" type="text" [(ngModel)]="countRef" placeholder="e.g. CC-NOV-2026" />
              </div>
              <div class="field-group">
                <label class="field-label">Performed By</label>
                <input class="field-input" type="text" [(ngModel)]="performedBy" placeholder="Staff name" />
              </div>
            </div>

            @if (setupError()) {
              <div class="error-msg">{{ setupError() }}</div>
            }

            <div class="btn-row">
              <button class="btn-primary" [disabled]="!!setupError()" (click)="startCount()">Start Count</button>
            </div>

          </div>
        </div>
      }

      <!-- ── STEP 2: Count Entry ────────────────────────────────────────────── -->
      @if (step() === 'COUNT') {

        <!-- Meta info row -->
        <div class="meta-row">
          <div class="meta-item">Reference: <strong>{{ countRef }}</strong></div>
          <div class="meta-item">Warehouse: <strong>{{ selectedWarehouseName() }}</strong></div>
          <div class="meta-item">Performed By: <strong>{{ performedBy }}</strong></div>
          <div class="meta-item">Date: <strong>{{ today }}</strong></div>
        </div>

        @if (countRows().length === 0) {
          <div class="empty-state">No stock found for the selected warehouse.</div>
        } @else {

          <div class="table-wrapper">
            <table class="count-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th style="text-align:right">System Qty</th>
                  <th style="text-align:right">Physical Count</th>
                  <th style="text-align:center">Variance</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                @for (row of countRows(); track row.item.id) {
                  <tr>
                    <td><strong>{{ row.item.name }}</strong></td>
                    <td style="color:#6b7280;font-size:12px">{{ row.item.sku }}</td>
                    <td style="text-align:right">{{ row.systemQty }}</td>
                    <td style="text-align:right">
                      <input
                        class="qty-input"
                        type="number"
                        min="0"
                        [ngModel]="row.physicalQty"
                        (ngModelChange)="updatePhysical(row, $event)"
                      />
                    </td>
                    <td style="text-align:center">
                      @if (row.physicalQty === row.systemQty) {
                        <span class="badge badge-match">Match</span>
                      } @else if (row.physicalQty > row.systemQty) {
                        <span class="badge badge-pos">+{{ row.physicalQty - row.systemQty }}</span>
                      } @else {
                        <span class="badge badge-neg">−{{ row.systemQty - row.physicalQty }}</span>
                      }
                    </td>
                    <td>
                      <input
                        class="note-input"
                        type="text"
                        [ngModel]="row.note"
                        (ngModelChange)="updateNote(row, $event)"
                        placeholder="Optional note…"
                      />
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Summary bar -->
          <div class="summary-bar">
            <div class="summary-stat">
              Variances found: <strong>{{ varianceCount() }}</strong>
            </div>
            <div class="summary-stat">
              Total variance: <strong>{{ totalVarianceDisplay() }}</strong>
            </div>
          </div>

          <div class="btn-row">
            <button class="btn-success" (click)="postAdjustments()">Post Adjustments</button>
            <button class="btn-secondary" (click)="saveDraft()">Save Draft</button>
            <button class="btn-secondary" (click)="resetToSetup()">← Back to Setup</button>
          </div>

        }
      }

    </div>
  `,
})
export class CycleCountPageComponent {
  readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  // ── Form state ────────────────────────────────────────────────────────────
  readonly step       = signal<Step>('SETUP');
  readonly warehouseId = signal('');
  warehouseIdVal = '';
  countRef       = '';
  performedBy    = '';

  readonly today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Count rows signal ─────────────────────────────────────────────────────
  readonly countRows = signal<CountRow[]>([]);

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly selectedWarehouseName = computed(() => {
    const whId = this.warehouseId();
    return this.inventorySvc.warehouses.find(w => w.id === whId)?.name ?? whId;
  });

  readonly setupError = computed((): string => {
    if (!this.warehouseId()) return 'Please select a warehouse.';
    return '';
  });

  readonly varianceCount = computed(() =>
    this.countRows().filter(r => r.physicalQty !== r.systemQty).length
  );

  readonly totalVariance = computed(() =>
    this.countRows().reduce((sum, r) => sum + (r.physicalQty - r.systemQty), 0)
  );

  readonly totalVarianceDisplay = computed(() => {
    const v = this.totalVariance();
    if (v === 0) return '±0 units';
    return (v > 0 ? '+' : '') + v + ' units';
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Mutates an individual row's physical count in the signal array */
  updatePhysical(row: CountRow, value: number): void {
    this.countRows.update(rows =>
      rows.map(r =>
        r.item.id === row.item.id
          ? { ...r, physicalQty: Math.max(0, Number(value) || 0) }
          : r
      )
    );
  }

  updateNote(row: CountRow, value: string): void {
    this.countRows.update(rows =>
      rows.map(r =>
        r.item.id === row.item.id ? { ...r, note: value } : r
      )
    );
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  startCount(): void {
    if (this.setupError()) return;

    const whId = this.warehouseId();
    const levels = this.inventorySvc.stockLevels().filter(sl => sl.warehouseId === whId);
    const items  = this.inventorySvc.items();

    const rows: CountRow[] = levels.map(sl => {
      const item = items.find(i => i.id === sl.itemId);
      if (!item) return null as unknown as CountRow;
      return {
        item,
        stockLevel: sl,
        systemQty:   sl.onHand,
        physicalQty: sl.onHand,
        note: '',
      };
    }).filter(Boolean);

    this.countRows.set(rows);
    this.step.set('COUNT');
  }

  saveDraft(): void {
    this.toastSvc.success(`Draft saved — ${this.countRows().length} items in progress.`);
  }

  postAdjustments(): void {
    const variantRows = this.countRows().filter(r => r.physicalQty !== r.systemQty);

    if (variantRows.length === 0) {
      this.toastSvc.success('No variances found — all counts match system quantities.');
      this.resetToSetup();
      return;
    }

    const ts = Date.now();
    variantRows.forEach((row, idx) => {
      const qty = row.physicalQty - row.systemQty;
      const movement: StockMovement = {
        id:               `MOV-CC-${ts}-${idx}`,
        itemId:           row.item.id,
        warehouseId:      this.warehouseId(),
        type:             'ADJUSTMENT',
        quantity:         qty,
        reference:        this.countRef || `CC-${ts}`,
        reason:           'Cycle count adjustment',
        performedBy:      this.performedBy.trim(),
        createdAt:        new Date().toISOString(),
        notes:            row.note || `Cycle count: system=${row.systemQty}, physical=${row.physicalQty}`,
        adjustmentReason: 'COUNTING_ERROR',
      };
      this.inventorySvc.addMovement(movement);
    });

    this.toastSvc.success(
      `Cycle count posted: ${variantRows.length} adjustment(s) across ${variantRows.length} item(s).`
    );
    this.resetToSetup();
  }

  resetToSetup(): void {
    this.step.set('SETUP');
    this.warehouseId.set('');
    this.warehouseIdVal = '';
    this.countRef = '';
    this.performedBy = '';
    this.countRows.set([]);
  }
}
