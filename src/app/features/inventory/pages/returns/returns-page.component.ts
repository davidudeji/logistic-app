import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { InventoryItem, StockMovement } from '../../inventory.model';

type ReturnType = 'RESTOCK' | 'QUARANTINE' | 'WRITE_OFF';

@Component({
  selector: 'app-returns-page',
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

    .content { padding: 0 28px 40px; max-width: 820px; }

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

    .error-msg { font-size: 12px; color: #dc2626; padding: 2px 0; }
    .field-hint { font-size: 11px; color: #6b7280; margin-top: 2px; font-style: italic; }

    .btn-row       { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-primary   { background: #111; color: #fff; border: none; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .btn-primary:disabled             { opacity: .45; cursor: default; }
    .btn-primary:not(:disabled):hover { background: #333; }
    .btn-secondary { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 22px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; transition: background .15s; }
    .btn-secondary:hover { background: #f9fafb; }

    /* Return type description hint */
    .return-type-hint { padding: 8px 12px; border-radius: 6px; font-size: 12px; line-height: 1.5; }
    .rth-restock    { background: #dcfce7; color: #15803d; }
    .rth-quarantine { background: #fef9c3; color: #854d0e; }
    .rth-writeoff   { background: #fee2e2; color: #991b1b; }

    /* Section title */
    .section-title { font-size: 14px; font-weight: 700; margin: 0 0 10px; }

    /* Table */
    .ledger-table   { width: 100%; border-collapse: collapse; font-size: 13px; }
    .ledger-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; }
    .ledger-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; vertical-align: top; }
    .ledger-table tr:last-child td { border-bottom: none; }

    .qty-pos { color: #16a34a; font-weight: 600; }
    .qty-neg { color: #dc2626; font-weight: 600; }

    .return-badge { display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: .04em; padding: 2px 7px; border-radius: 999px; text-transform: uppercase; }
    .badge-restock    { background: #dcfce7; color: #16a34a; }
    .badge-quarantine { background: #fef9c3; color: #854d0e; }
    .badge-writeoff   { background: #fee2e2; color: #dc2626; }

    .empty-state { color: #9ca3af; font-size: 13px; padding: 10px 0; }
    .table-wrap  { overflow-x: auto; }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <h1 class="page-title">Returns &amp; RMA</h1>
      <p class="page-sub">Process customer returns — restock, quarantine or write off</p>
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

      <!-- ── New Return Form ───────────────────────────────────────────────── -->
      <div class="form-card">
        <div class="form-card-header">
          <div class="form-card-title">New Return / RMA</div>
        </div>
        <div class="form-card-body">

          <div class="field-row">
            <!-- Return Reference -->
            <div class="field-group">
              <label class="field-label">Return Reference <span style="font-weight:400;text-transform:none">(leave blank to auto-generate)</span></label>
              <input class="field-input" type="text" [(ngModel)]="returnRef" placeholder="e.g. RMA-2026-001" />
            </div>
            <!-- Performed By -->
            <div class="field-group">
              <label class="field-label">Performed By</label>
              <input class="field-input" type="text" [(ngModel)]="performedBy" placeholder="Staff name" />
            </div>
          </div>

          <div class="field-row">
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

            <!-- Item — all items shown regardless of stock -->
            <div class="field-group">
              <label class="field-label">Item</label>
              <select class="field-select" [(ngModel)]="itemIdVal" (ngModelChange)="itemId.set($event)" [disabled]="!warehouseId()">
                <option value="">— Select item —</option>
                @for (item of allItems(); track item.id) {
                  <option [value]="item.id">{{ item.name }} ({{ item.sku }})</option>
                }
              </select>
            </div>
          </div>

          <div class="field-row">
            <!-- Quantity -->
            <div class="field-group" style="max-width:160px">
              <label class="field-label">Quantity</label>
              <input class="field-input" type="number" min="1" [(ngModel)]="qtyVal" (ngModelChange)="qty.set(+$event)" placeholder="e.g. 5" />
            </div>

            <!-- Return Type -->
            <div class="field-group">
              <label class="field-label">Return Type</label>
              <select class="field-select" [(ngModel)]="returnType">
                <option value="">— Select type —</option>
                <option value="RESTOCK">RESTOCK — Good condition, back to stock</option>
                <option value="QUARANTINE">QUARANTINE — Needs inspection, hold stock</option>
                <option value="WRITE_OFF">WRITE_OFF — Unusable, remove from stock</option>
              </select>
            </div>
          </div>

          <!-- Return type hint -->
          @if (returnType === 'RESTOCK') {
            <div class="return-type-hint rth-restock">
              ✓ Item will be added back to available stock (+{{ qty() || 0 }} units).
            </div>
          }
          @if (returnType === 'QUARANTINE') {
            <div class="return-type-hint rth-quarantine">
              ⚠ Item will be received but marked as damaged / quarantined — available stock unchanged pending inspection.
            </div>
          }
          @if (returnType === 'WRITE_OFF') {
            <div class="return-type-hint rth-writeoff">
              ✗ Item is unusable. Stock will be reduced by {{ qty() || 0 }} units.
            </div>
          }

          <div class="field-row">
            <!-- Return Reason -->
            <div class="field-group">
              <label class="field-label">Return Reason <span style="font-weight:400;text-transform:none">(optional)</span></label>
              <input class="field-input" type="text" [(ngModel)]="returnReason" placeholder="e.g. Wrong item delivered, Customer cancelled" />
            </div>
            <!-- Notes -->
            <div class="field-group">
              <label class="field-label">Notes <span style="font-weight:400;text-transform:none">(optional)</span></label>
              <input class="field-input" type="text" [(ngModel)]="notes" placeholder="Additional notes…" />
            </div>
          </div>

          @if (validationError()) {
            <div class="error-msg">{{ validationError() }}</div>
          }

          <div class="btn-row">
            <button class="btn-primary" [disabled]="!!validationError()" (click)="postReturn()">
              Post Return
            </button>
            <button class="btn-secondary" (click)="resetForm()">Reset</button>
          </div>

        </div>
      </div>

      <!-- ── Recent Returns Table ──────────────────────────────────────────── -->
      <div class="section-title">Recent Returns (Last 15)</div>

      @if (recentReturns().length > 0) {
        <div class="table-wrap">
          <table class="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Item</th>
                <th>Warehouse</th>
                <th>Type</th>
                <th style="text-align:right">Qty</th>
                <th>Performed By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (m of recentReturns(); track m.id) {
                <tr>
                  <td style="white-space:nowrap">{{ m.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                  <td style="font-size:12px;color:#6b7280">{{ m.reference }}</td>
                  <td>{{ itemName(m.itemId) }}</td>
                  <td>{{ warehouseName(m.warehouseId) }}</td>
                  <td>
                    @if (returnTypeBadge(m) === 'RESTOCK') {
                      <span class="return-badge badge-restock">RESTOCK</span>
                    }
                    @if (returnTypeBadge(m) === 'QUARANTINE') {
                      <span class="return-badge badge-quarantine">QUARANTINE</span>
                    }
                    @if (returnTypeBadge(m) === 'WRITE_OFF') {
                      <span class="return-badge badge-writeoff">WRITE_OFF</span>
                    }
                    @if (returnTypeBadge(m) === 'RETURN') {
                      <span class="return-badge badge-restock">RETURN</span>
                    }
                  </td>
                  <td style="text-align:right">
                    @if (m.quantity > 0) {
                      <span class="qty-pos">+{{ m.quantity }}</span>
                    } @else if (m.quantity < 0) {
                      <span class="qty-neg">{{ m.quantity }}</span>
                    } @else {
                      <span style="color:#6b7280">0</span>
                    }
                  </td>
                  <td>{{ m.performedBy }}</td>
                  <td style="color:#6b7280;font-size:12px;max-width:200px">{{ m.notes || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="empty-state">No return movements recorded yet.</div>
      }

    </div>
  `,
})
export class ReturnsPageComponent {
  readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  // ── Form state ────────────────────────────────────────────────────────────
  readonly warehouseId = signal('');
  readonly itemId      = signal('');
  readonly qty         = signal(0);

  warehouseIdVal = '';
  itemIdVal      = '';
  qtyVal         = 0;
  returnRef      = '';
  performedBy    = '';
  returnType: ReturnType | '' = '';
  returnReason   = '';
  notes          = '';

  // ── Computed ──────────────────────────────────────────────────────────────

  /** All items (returns can be from any item, regardless of current stock) */
  readonly allItems = computed((): InventoryItem[] =>
    this.inventorySvc.items()
  );

  /** Validation error or empty string */
  readonly validationError = computed((): string => {
    if (!this.warehouseId())   return 'Please select a warehouse.';
    if (!this.itemId())        return 'Please select an item.';
    if (this.qty() <= 0)       return 'Quantity must be greater than 0.';
    if (!this.returnType)      return 'Please select a Return Type.';
    if (!this.performedBy.trim()) return 'Please enter who is performing the return.';
    return '';
  });

  /** Last 15 RETURN movements + WRITE_OFF adjustments from returns, most recent first */
  readonly recentReturns = computed(() => {
    const all = this.inventorySvc.movements();
    // We tag return-originated movements with a reference starting 'RMA-'
    return all
      .filter(m =>
        m.type === 'RETURN' ||
        (m.type === 'ADJUSTMENT' && m.reference.startsWith('RMA-'))
      )
      .slice(-15)
      .reverse();
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  itemName(itemId: string): string {
    return this.inventorySvc.items().find(i => i.id === itemId)?.name ?? itemId;
  }

  warehouseName(whId: string): string {
    return this.inventorySvc.warehouses.find(w => w.id === whId)?.name ?? whId;
  }

  /** Determine display badge type from movement */
  returnTypeBadge(m: StockMovement): string {
    if (m.type === 'RETURN') return 'RESTOCK';
    if (m.adjustmentReason === 'DAMAGE') return 'QUARANTINE';
    if (m.adjustmentReason === 'WRITE_OFF') return 'WRITE_OFF';
    return 'RETURN';
  }

  // ── Event handlers ────────────────────────────────────────────────────────

  onWarehouseChange(value: string): void {
    this.warehouseId.set(value);
    this.itemIdVal = '';
    this.itemId.set('');
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  postReturn(): void {
    if (this.validationError()) return;

    const ref = this.returnRef.trim() || `RMA-${Date.now()}`;
    const ts  = Date.now();
    const qty = this.qty();
    const combinedNotes = [this.returnReason.trim(), this.notes.trim()].filter(Boolean).join(' | ');

    let movement: StockMovement;

    switch (this.returnType as ReturnType) {
      case 'RESTOCK':
        movement = {
          id:           `MOV-RMA-${ts}`,
          itemId:       this.itemId(),
          warehouseId:  this.warehouseId(),
          type:         'RETURN',
          quantity:     qty,
          reference:    ref,
          reason:       `Customer return — restock: ${this.returnReason || 'N/A'}`,
          performedBy:  this.performedBy.trim(),
          createdAt:    new Date().toISOString(),
          notes:        combinedNotes || `Returned ${qty} unit(s) in good condition.`,
        };
        break;

      case 'QUARANTINE':
        movement = {
          id:               `MOV-RMA-${ts}`,
          itemId:           this.itemId(),
          warehouseId:      this.warehouseId(),
          type:             'ADJUSTMENT',
          quantity:         0,  // received but stock not changed — awaiting inspection
          reference:        ref,
          reason:           `Customer return — quarantine pending inspection: ${this.returnReason || 'N/A'}`,
          performedBy:      this.performedBy.trim(),
          createdAt:        new Date().toISOString(),
          notes:            `Quarantined - awaiting inspection: ${combinedNotes || '(no notes)'}`,
          adjustmentReason: 'DAMAGE',
        };
        break;

      case 'WRITE_OFF':
      default:
        movement = {
          id:               `MOV-RMA-${ts}`,
          itemId:           this.itemId(),
          warehouseId:      this.warehouseId(),
          type:             'ADJUSTMENT',
          quantity:         -qty,  // negative — remove from stock
          reference:        ref,
          reason:           `Customer return — write-off (unusable): ${this.returnReason || 'N/A'}`,
          performedBy:      this.performedBy.trim(),
          createdAt:        new Date().toISOString(),
          notes:            combinedNotes || `Written off ${qty} unit(s) as unusable.`,
          adjustmentReason: 'WRITE_OFF',
        };
        break;
    }

    this.inventorySvc.addMovement(movement);

    const typeLabel = this.returnType === 'RESTOCK'    ? 'restocked to stock'
                    : this.returnType === 'QUARANTINE' ? 'quarantined for inspection'
                    : 'written off';
    this.toastSvc.success(
      `Return ${ref} posted: ${qty} unit(s) of "${this.itemName(this.itemId())}" ${typeLabel}.`
    );

    this.resetForm();
  }

  resetForm(): void {
    this.warehouseIdVal = '';
    this.itemIdVal      = '';
    this.qtyVal         = 0;
    this.returnRef      = '';
    this.performedBy    = '';
    this.returnType     = '';
    this.returnReason   = '';
    this.notes          = '';
    this.warehouseId.set('');
    this.itemId.set('');
    this.qty.set(0);
  }
}
