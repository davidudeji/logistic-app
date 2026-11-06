import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StockMovement } from '../../inventory.model';

@Component({
  selector: 'app-transfer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; color: #111; }

    .page-header { padding: 24px 28px 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
    .page-title  { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-sub    { font-size: 13px; color: #6b7280; margin: 0; }
    /* Sub-nav */
    .sub-nav { display: flex; gap: 4px; padding: 0 28px; margin-bottom: 24px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
    .sub-nav-link { padding: 10px 14px; font-size: 13px; font-family: 'Times New Roman', serif; text-decoration: none; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color 0.15s; }
    .sub-nav-link:hover { color: #111; }
    .sub-nav-active { color: #111 !important; border-bottom-color: #111 !important; font-weight: 600; }

    .content     { padding: 0 28px 32px; max-width: 700px; }

    .form-card   { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 28px; }
    .form-card-header { padding: 14px 18px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .form-card-title  { font-size: 15px; font-weight: 700; margin: 0; }
    .form-card-body   { padding: 20px 18px; display: flex; flex-direction: column; gap: 14px; }

    .field-row   { display: flex; gap: 14px; flex-wrap: wrap; }
    .field-group { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 180px; }
    .field-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; color: #6b7280; }
    .field-input, .field-select { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; font-family: 'Times New Roman', serif; font-size: 13px; width: 100%; box-sizing: border-box; background: #fff; }
    .field-input:focus, .field-select:focus { outline: none; border-color: #111; }

    .stock-hint  { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .stock-warn  { color: #dc2626; }

    .error-msg   { font-size: 12px; color: #dc2626; padding: 2px 0; }

    .btn-row     { display: flex; gap: 10px; margin-top: 4px; }
    .btn-primary { background: #111; color: #fff; border: none; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:disabled { opacity: .45; cursor: default; }
    .btn-primary:not(:disabled):hover { background: #333; }
    .btn-secondary { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; }
    .btn-secondary:hover { background: #f9fafb; }

    /* Transfer history ledger */
    .section-title { font-size: 14px; font-weight: 700; margin: 0 0 10px; }
    .ledger-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ledger-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; }
    .ledger-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; }

    .empty-state { color: #9ca3af; font-size: 13px; padding: 10px 0; }

    .arrow-label { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 10px 12px; background: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb; }
    .arrow-sep   { color: #6b7280; font-size: 18px; }
  `],
  template: `
    <div class="page-header">
      <h1 class="page-title">Transfer Stock</h1>
      <p class="page-sub">Move inventory between warehouses</p>
    </div>

    <!-- Sub-nav -->
    <nav class="sub-nav">
      <a class="sub-nav-link" routerLink="/inventory" routerLinkActive="sub-nav-active" [routerLinkActiveOptions]="{exact:true}">Stock Master</a>
      <a class="sub-nav-link" routerLink="/inventory/grn" routerLinkActive="sub-nav-active">Receiving (GRN)</a>
      <a class="sub-nav-link" routerLink="/inventory/dispatch-orders" routerLinkActive="sub-nav-active">Dispatch Orders</a>
      <a class="sub-nav-link" routerLink="/inventory/transfer" routerLinkActive="sub-nav-active">Transfer</a>
      <a class="sub-nav-link" routerLink="/inventory/adjustments" routerLinkActive="sub-nav-active">Adjustments</a>
      <a class="sub-nav-link" routerLink="/inventory/alerts" routerLinkActive="sub-nav-active">Alerts</a>
      <a class="sub-nav-link" routerLink="/inventory/reports" routerLinkActive="sub-nav-active">Reports</a>
      <a class="sub-nav-link" routerLink="/inventory/returns" routerLinkActive="sub-nav-active">Returns</a>
    </nav>

    <div class="content">
      <div class="form-card">
        <div class="form-card-header">
          <div class="form-card-title">New Transfer</div>
        </div>
        <div class="form-card-body">

          <!-- From / To Warehouses -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">From Warehouse</label>
              <select class="field-select" [(ngModel)]="fromWarehouseId" (ngModelChange)="onWarehouseChange()">
                <option value="">— Select source —</option>
                @for (wh of warehouses; track wh.id) {
                  <option [value]="wh.id">{{ wh.name }}</option>
                }
              </select>
            </div>
            <div style="display:flex;align-items:flex-end;padding-bottom:2px">
              <div class="arrow-sep">→</div>
            </div>
            <div class="field-group">
              <label class="field-label">To Warehouse</label>
              <select class="field-select" [(ngModel)]="toWarehouseId">
                <option value="">— Select destination —</option>
                @for (wh of warehouses; track wh.id) {
                  @if (wh.id !== fromWarehouseId) {
                    <option [value]="wh.id">{{ wh.name }}</option>
                  }
                }
              </select>
            </div>
          </div>

          <!-- Item Select -->
          <div class="field-group">
            <label class="field-label">Item</label>
            <select class="field-select" [(ngModel)]="selectedItemId" [disabled]="!fromWarehouseId" (ngModelChange)="onItemChange()">
              <option value="">— Select item —</option>
              @for (item of availableItems(); track item.itemId) {
                <option [value]="item.itemId">{{ item.itemName }} ({{ item.sku }})</option>
              }
            </select>
            @if (fromWarehouseId && availableItems().length === 0) {
              <span class="stock-hint stock-warn">No stock available in this warehouse.</span>
            }
          </div>

          <!-- Quantity -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Quantity</label>
              <input class="field-input" type="number" min="1" [(ngModel)]="quantity" placeholder="0" />
              @if (selectedItemId) {
                <span class="stock-hint">
                  Available: <strong>{{ availableQty() }}</strong> units
                  @if (quantity > availableQty()) {
                    <span class="stock-warn"> — exceeds available stock!</span>
                  }
                </span>
              }
            </div>
            <div class="field-group">
              <label class="field-label">Reference No.</label>
              <input class="field-input" type="text" [(ngModel)]="reference" placeholder="e.g. TRF-2026-001" />
            </div>
          </div>

          <!-- Performed By & Notes -->
          <div class="field-row">
            <div class="field-group">
              <label class="field-label">Performed By</label>
              <input class="field-input" type="text" [(ngModel)]="performedBy" placeholder="Staff name" />
            </div>
            <div class="field-group" style="flex:2">
              <label class="field-label">Notes</label>
              <input class="field-input" type="text" [(ngModel)]="notes" placeholder="Optional notes…" />
            </div>
          </div>

          @if (validationError()) {
            <div class="error-msg">{{ validationError() }}</div>
          }

          <div class="btn-row">
            <button class="btn-primary" [disabled]="!!validationError() || !canSubmit()" (click)="postTransfer()">
              Post Transfer
            </button>
            <button class="btn-secondary" (click)="resetForm()">Reset</button>
          </div>
        </div>
      </div>

      <!-- Transfer History -->
      <div class="section-title">Transfer History (Last 10)</div>
      @if (recentTransfers().length > 0) {
        <table class="ledger-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Item ID</th>
              <th>From WH</th>
              <th>Reference</th>
              <th style="text-align:right">Qty</th>
              <th>Performed By</th>
            </tr>
          </thead>
          <tbody>
            @for (m of recentTransfers(); track m.id) {
              <tr>
                <td>{{ m.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                <td>{{ m.itemId }}</td>
                <td>{{ m.warehouseId }}</td>
                <td>{{ m.reference }}</td>
                <td style="text-align:right">{{ m.quantity }}</td>
                <td>{{ m.performedBy }}</td>
              </tr>
            }
          </tbody>
        </table>
      } @else {
        <div class="empty-state">No transfer movements recorded yet.</div>
      }
    </div>
  `,
})
export class TransferPageComponent {
  private readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  readonly warehouses = this.inventorySvc.warehouses;

  // Form state
  fromWarehouseId = '';
  toWarehouseId = '';
  selectedItemId = '';
  quantity = 0;
  reference = '';
  performedBy = '';
  notes = '';

  // Items that have stock in the selected FROM warehouse
  readonly availableItems = computed(() => {
    if (!this.fromWarehouseId) return [];
    return this.inventorySvc.stockLevels()
      .filter(sl => sl.warehouseId === this.fromWarehouseId && sl.available > 0)
      .map(sl => {
        const item = this.inventorySvc.items().find(i => i.id === sl.itemId);
        return item
          ? { itemId: item.id, itemName: item.name, sku: item.sku, available: sl.available }
          : null;
      })
      .filter((x): x is { itemId: string; itemName: string; sku: string; available: number } => !!x);
  });

  readonly availableQty = computed(() => {
    if (!this.selectedItemId || !this.fromWarehouseId) return 0;
    const sl = this.inventorySvc.stockLevels().find(
      s => s.itemId === this.selectedItemId && s.warehouseId === this.fromWarehouseId
    );
    return sl?.available ?? 0;
  });

  readonly validationError = computed(() => {
    if (!this.fromWarehouseId) return 'Please select a source warehouse.';
    if (!this.toWarehouseId) return 'Please select a destination warehouse.';
    if (this.fromWarehouseId === this.toWarehouseId) return 'Source and destination must differ.';
    if (!this.selectedItemId) return 'Please select an item.';
    if (!this.quantity || this.quantity <= 0) return 'Quantity must be greater than zero.';
    if (this.quantity > this.availableQty()) return 'Quantity exceeds available stock.';
    if (!this.performedBy.trim()) return 'Please enter who is performing the transfer.';
    return '';
  });

  readonly canSubmit = computed(() =>
    !!this.fromWarehouseId && !!this.toWarehouseId && !!this.selectedItemId &&
    this.quantity > 0 && !!this.performedBy.trim()
  );

  readonly recentTransfers = computed(() =>
    this.inventorySvc.movements()
      .filter(m => m.type === 'TRANSFER')
      .slice(-10)
      .reverse()
  );

  onWarehouseChange(): void {
    this.selectedItemId = '';
    this.quantity = 0;
  }

  onItemChange(): void {
    this.quantity = 0;
  }

  postTransfer(): void {
    if (this.validationError() || !this.canSubmit()) return;

    const ref = this.reference.trim() || ('TRF-' + Date.now());
    const now = new Date().toISOString();
    const by = this.performedBy.trim();

    // 1. TRANSFER movement on the FROM warehouse (reduces stock, increases inTransit)
    const transferOut: StockMovement = {
      id: 'MOV-' + Date.now() + '-OUT',
      itemId: this.selectedItemId,
      warehouseId: this.fromWarehouseId,
      type: 'TRANSFER',
      quantity: this.quantity,
      reference: ref,
      reason: `Inter-warehouse transfer to ${this.toWarehouseId}`,
      performedBy: by,
      createdAt: now,
      notes: this.notes,
    };
    this.inventorySvc.addMovement(transferOut);

    // 2. RECEIPT movement on the TO warehouse (increases onHand/available, reduces inTransit)
    const receiptIn: StockMovement = {
      id: 'MOV-' + Date.now() + '-IN',
      itemId: this.selectedItemId,
      warehouseId: this.toWarehouseId,
      type: 'RECEIPT',
      quantity: this.quantity,
      reference: ref,
      reason: `Inter-warehouse receipt from ${this.fromWarehouseId}`,
      performedBy: by,
      createdAt: now,
      notes: this.notes,
    };
    this.inventorySvc.addMovement(receiptIn);

    this.toastSvc.success(`Transfer ${ref} posted: ${this.quantity} units from ${this.fromWarehouseId} → ${this.toWarehouseId}.`);
    this.resetForm();
  }

  resetForm(): void {
    this.fromWarehouseId = '';
    this.toWarehouseId = '';
    this.selectedItemId = '';
    this.quantity = 0;
    this.reference = '';
    this.performedBy = '';
    this.notes = '';
  }
}
