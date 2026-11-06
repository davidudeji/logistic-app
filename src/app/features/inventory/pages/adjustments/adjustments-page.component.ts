import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { AdjustmentReason, InventoryItem, StockMovement } from '../../inventory.model';

@Component({
  selector: 'app-adjustments-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; color: #111; background: #fbfbfb; }

    .page-header { padding: 24px 28px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
    .page-title  { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #6b7280; margin: 0; }

    /* Sub-nav */
    .sub-nav { display: flex; gap: 4px; padding: 0 28px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
    .sub-nav-link { padding: 10px 14px; font-size: 13px; font-family: 'Times New Roman', serif; text-decoration: none; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color .15s; }
    .sub-nav-link:hover { color: #111; }
    .sub-nav-active { color: #111; border-bottom-color: #111; font-weight: 600; }

    .content { padding: 0 28px 40px; max-width: 740px; }

    /* Form card */
    .form-card        { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 32px; }
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
    .field-input:disabled,
    .field-select:disabled { background: #f9fafb; cursor: not-allowed; color: #9ca3af; }

    .stock-hint { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .qty-note   { font-size: 11px; color: #6b7280; margin-top: 2px; font-style: italic; }

    .error-msg  { font-size: 12px; color: #dc2626; padding: 2px 0; }

    .btn-row       { display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
    .btn-primary   { background: #111; color: #fff; border: none; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .btn-primary:disabled            { opacity: .45; cursor: default; }
    .btn-primary:not(:disabled):hover { background: #333; }
    .btn-secondary { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; transition: background .15s; }
    .btn-secondary:hover { background: #f9fafb; }

    /* Table */
    .section-title  { font-size: 14px; font-weight: 700; margin: 0 0 10px; }
    .ledger-table   { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ledger-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    .ledger-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
    .ledger-table tr:last-child td { border-bottom: none; }

    .qty-pos    { color: #16a34a; font-weight: 600; }
    .qty-neg    { color: #dc2626; font-weight: 600; }

    .empty-state { color: #9ca3af; font-size: 13px; padding: 10px 0; }
    .reason-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .04em; padding: 2px 7px; border-radius: 999px; background: #f3f4f6; color: #374151; text-transform: uppercase; }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">Stock Adjustments</h1>
      <p class="page-sub">Record ad-hoc stock corrections with reason codes</p>
    </div>

    <!-- Sub-nav -->
    <nav class="sub-nav">
      <a class="sub-nav-link" routerLink="/inventory"             routerLinkActive="sub-nav-active" [routerLinkActiveOptions]="{exact:true}">Stock Master</a>
      <a class="sub-nav-link" routerLink="/inventory/grn"         routerLinkActive="sub-nav-active">Receiving (GRN)</a>
      <a class="sub-nav-link" routerLink="/inventory/dispatch-orders" routerLinkActive="sub-nav-active">Dispatch Orders</a>
      <a class="sub-nav-link" routerLink="/inventory/transfer"    routerLinkActive="sub-nav-active">Transfer</a>
      <a class="sub-nav-link" routerLink="/inventory/adjustments" routerLinkActive="sub-nav-active">Adjustments</a>
      <a class="sub-nav-link" routerLink="/inventory/alerts"      routerLinkActive="sub-nav-active">Alerts</a>
      <a class="sub-nav-link" routerLink="/inventory/reports"     routerLinkActive="sub-nav-active">Reports</a>
      <a class="sub-nav-link" routerLink="/inventory/returns"     routerLinkActive="sub-nav-active">Returns</a>
    </nav>

    <div class="content">

      <!-- New Adjustment form card -->
      <div class="form-card">
        <div class="form-card-header">
          <div class="form-card-title">New Adjustment</div>
        </div>
        <div class="form-card-body">

          <!-- Warehouse -->
          <div class="field-group">
            <label class="field-label">Warehouse</label>
            <select class="field-select" [(ngModel)]="warehouseIdVal" (ngModelChange)="onWarehouseChange($event)">
              <option value="">— Select warehouse —</option>
              @for (wh of inventorySvc.warehouses; track wh.id) {
                <option [value]="wh.id">{{ wh.name }}</option>
              }
            </select>
          </div>

          <!-- Item -->
          <div class="field-group">
            <label class="field-label">Item</label>
            <select class="field-select" [(ngModel)]="itemIdVal" (ngModelChange)="onItemChange($event)" [disabled]="!warehouseId()">
              <option value="">— Select item —</option>
              @for (item of availableItems(); track item.id) {
                <option [value]="item.id">{{ item.name }} ({{ item.sku }})</option>
              }
            </select>
            @if (warehouseId() && availableItems().length === 0) {
              <span class="stock-hint" style="color:#dc2626">No stock found in this warehouse.</span>
            }
            @if (selectedStockLevel()) {
              <span class="stock-hint">
                On hand: <strong>{{ selectedStockLevel()!.onHand }}</strong> &nbsp;|&nbsp;
                Available: <strong>{{ selectedStockLevel()!.available }}</strong> units
              </span>
            }
          </div>

          <!-- Quantity & Reason -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Quantity</label>
              <input class="field-input" type="number" [(ngModel)]="qtyVal" (ngModelChange)="onQtyChange($event)" placeholder="e.g. -5 or 10" />
              <span class="qty-note">Use negative for write-downs, positive for found stock</span>
            </div>
            <div class="field-group">
              <label class="field-label">Adjustment Reason</label>
              <select class="field-select" [(ngModel)]="adjustmentReason">
                <option value="">— Select reason —</option>
                @for (r of reasons; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Performed By & Notes -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Performed By</label>
              <input class="field-input" type="text" [(ngModel)]="performedBy" placeholder="Staff name" />
            </div>
            <div class="field-group" style="flex:2">
              <label class="field-label">Notes <span style="font-weight:400;text-transform:none">(optional)</span></label>
              <input class="field-input" type="text" [(ngModel)]="notes" placeholder="e.g. Physical count discrepancy…" />
            </div>
          </div>

          @if (validationError()) {
            <div class="error-msg">{{ validationError() }}</div>
          }

          <div class="btn-row">
            <button class="btn-primary" [disabled]="!!validationError()" (click)="postAdjustment()">
              Post Adjustment
            </button>
            <button class="btn-secondary" (click)="resetForm()">Reset</button>
          </div>

        </div>
      </div>

      <!-- Recent Adjustments table -->
      <div class="section-title">Recent Adjustments (Last 20)</div>
      @if (recentAdjustments().length > 0) {
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Reason</th>
              <th style="text-align:right">Qty</th>
              <th>Performed By</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            @for (m of recentAdjustments(); track m.id) {
              <tr>
                <td style="white-space:nowrap">{{ m.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                <td>{{ itemName(m.itemId) }}</td>
                <td>{{ m.warehouseId }}</td>
                <td><span class="reason-badge">{{ m.adjustmentReason ?? '—' }}</span></td>
                <td style="text-align:right">
                  @if (m.quantity >= 0) {
                    <span class="qty-pos">+{{ m.quantity }}</span>
                  } @else {
                    <span class="qty-neg">{{ m.quantity }}</span>
                  }
                </td>
                <td>{{ m.performedBy }}</td>
                <td style="color:#6b7280;font-size:12px">{{ m.notes || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty-state">No adjustment movements recorded yet.</div>
      }

    </div>
  `,
})
export class AdjustmentsPageComponent {
  readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  // ── Signals for form bindings ─────────────────────────────────────────────
  readonly warehouseId = signal('');
  readonly itemId      = signal('');
  readonly qty         = signal(0);

  // Plain two-way bound properties (non-signal fields)
  warehouseIdVal   = '';
  itemIdVal        = '';
  qtyVal           = 0;
  adjustmentReason: AdjustmentReason | '' = '';
  performedBy      = '';
  notes            = '';

  // ── Reason code options ───────────────────────────────────────────────────
  readonly reasons: { value: AdjustmentReason; label: string }[] = [
    { value: 'THEFT',          label: 'Theft' },
    { value: 'DAMAGE',         label: 'Damage' },
    { value: 'EXPIRY',         label: 'Expiry' },
    { value: 'COUNTING_ERROR', label: 'Counting Error' },
    { value: 'SUPPLIER_RETURN',label: 'Supplier Return' },
    { value: 'WRITE_OFF',      label: 'Write-Off' },
    { value: 'OTHER',          label: 'Other' },
  ];

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Items that have a stock level record in the selected warehouse */
  readonly availableItems = computed((): InventoryItem[] => {
    const whId = this.warehouseId();
    if (!whId) return [];
    const stockedItemIds = new Set(
      this.inventorySvc.stockLevels()
        .filter(sl => sl.warehouseId === whId)
        .map(sl => sl.itemId)
    );
    return this.inventorySvc.items().filter(i => stockedItemIds.has(i.id));
  });

  /** StockLevel for the currently selected item + warehouse */
  readonly selectedStockLevel = computed(() => {
    const whId  = this.warehouseId();
    const iId   = this.itemId();
    if (!whId || !iId) return null;
    return this.inventorySvc.stockLevels().find(
      sl => sl.warehouseId === whId && sl.itemId === iId
    ) ?? null;
  });

  /** Returns a validation error string, or '' if the form is valid */
  readonly validationError = computed((): string => {
    if (!this.warehouseId())              return 'Please select a warehouse.';
    if (!this.itemId())                   return 'Please select an item.';
    if (this.qty() === 0)                 return 'Quantity must be non-zero.';
    if (!this.adjustmentReason)           return 'Please select an adjustment reason.';
    if (!this.performedBy.trim())         return 'Please enter who is performing the adjustment.';
    return '';
  });

  /** Last 20 ADJUSTMENT movements, most recent first */
  readonly recentAdjustments = computed(() =>
    this.inventorySvc.movements()
      .filter(m => m.type === 'ADJUSTMENT')
      .slice(-20)
      .reverse()
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  itemName(itemId: string): string {
    return this.inventorySvc.items().find(i => i.id === itemId)?.name ?? itemId;
  }

  // ── Event handlers for ngModel → signal sync ──────────────────────────────

  onWarehouseChange(value: string): void {
    this.warehouseId.set(value);
    this.itemIdVal = '';
    this.itemId.set('');
    this.qtyVal = 0;
    this.qty.set(0);
  }

  onItemChange(value: string): void {
    this.itemId.set(value);
    this.qtyVal = 0;
    this.qty.set(0);
  }

  onQtyChange(value: number): void {
    this.qty.set(Number(value));
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  postAdjustment(): void {
    if (this.validationError()) return;

    const ref = 'ADJ-' + Date.now();

    const movement: StockMovement = {
      id:               'MOV-' + Date.now(),
      itemId:           this.itemId(),
      warehouseId:      this.warehouseId(),
      type:             'ADJUSTMENT',
      quantity:         this.qty(),         // signed — negative = write-down
      reference:        ref,
      reason:           `Adjustment: ${this.adjustmentReason}`,
      performedBy:      this.performedBy.trim(),
      createdAt:        new Date().toISOString(),
      notes:            this.notes.trim(),
      adjustmentReason: this.adjustmentReason as AdjustmentReason,
    };

    this.inventorySvc.addMovement(movement);

    const sign = this.qty() > 0 ? '+' : '';
    this.toastSvc.success(
      `Adjustment ${ref} posted: ${sign}${this.qty()} units (${this.adjustmentReason}) on ${this.warehouseId()}.`
    );

    this.resetForm();
  }

  resetForm(): void {
    this.warehouseIdVal    = '';
    this.itemIdVal         = '';
    this.qtyVal            = 0;
    this.adjustmentReason  = '';
    this.performedBy       = '';
    this.notes             = '';
    this.warehouseId.set('');
    this.itemId.set('');
    this.qty.set(0);
  }
}
