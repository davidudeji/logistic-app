import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, RouterLink } from '@angular/router';

import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StockMovement, LowStockAlert } from '../../inventory.model';

// ─── Category label map ───────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  FOOD_AND_BEVERAGE:   'Food & Beverage',
  BUILDING_MATERIALS:  'Building Materials',
  PHARMACEUTICALS:     'Pharmaceuticals',
  ELECTRONICS:         'Electronics',
  AUTOMOTIVE_PARTS:    'Automotive Parts',
  CHEMICALS:           'Chemicals',
  TEXTILES:            'Textiles',
  AGRICULTURAL:        'Agricultural',
  GENERAL_MERCHANDISE: 'General Merchandise',
};

@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RouterLink],
  template: `
    <!-- ── Page Header ──────────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Low-Stock Alerts</h1>
        <p class="page-subtitle">Items at or below reorder point across all warehouses</p>
      </div>
    </div>

    <!-- ── Sub-Nav ──────────────────────────────────────────────────────────── -->
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

    <!-- ── Summary Banner ──────────────────────────────────────────────────── -->
    <div class="summary-banner">
      <div class="summary-item">
        <span class="summary-badge amber">{{ alerts().length }}</span>
        <span class="summary-label">Low-Stock Items</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item">
        <span class="summary-badge red">{{ outOfStockCount() }}</span>
        <span class="summary-label">Out of Stock</span>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-item summary-time">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Last checked: {{ now | date:'dd MMM yyyy, HH:mm' }}</span>
      </div>
    </div>

    <!-- ── Alert Cards ──────────────────────────────────────────────────────── -->
    @if (alerts().length > 0) {
      <div class="cards-list">
        @for (alert of alerts(); track alert.item.id) {
          <div class="alert-card">
            <!-- Card Header -->
            <div class="card-header-row">
              <div class="card-title-block">
                <span class="item-name">{{ alert.item.name }}</span>
                <span class="item-sku">{{ alert.item.sku }}</span>
              </div>
              <div class="card-badges">
                <span class="category-chip">{{ categoryLabel(alert.item.category) }}</span>
                @if (alert.currentStock === 0) {
                  <span class="severity-badge out">OUT OF STOCK</span>
                } @else {
                  <span class="severity-badge low">LOW STOCK</span>
                }
              </div>
            </div>

            <!-- Stock Bar -->
            <div class="stock-bar">
              <div class="stock-bar-item">
                <span class="stock-bar-value" [class.zero]="alert.currentStock === 0">{{ alert.currentStock }}</span>
                <span class="stock-bar-label">Available</span>
              </div>
              <div class="stock-bar-sep">|</div>
              <div class="stock-bar-item">
                <span class="stock-bar-value reorder">{{ alert.reorderPoint }}</span>
                <span class="stock-bar-label">Reorder Point</span>
              </div>
              <div class="stock-bar-sep">|</div>
              <div class="stock-bar-item">
                <span class="stock-bar-value safety">{{ alert.item.safetyStock }}</span>
                <span class="stock-bar-label">Safety Stock</span>
              </div>
            </div>

            <!-- Warehouse & Actions -->
            <div class="card-footer-row">
              <div class="warehouse-info">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>{{ warehouseName(alert.item.id) }}</span>
              </div>
              <div class="card-actions">
                <button class="btn-secondary" (click)="openQuickReceipt(alert.item.id)">Quick Receipt</button>
                <a class="btn-ghost" routerLink="/inventory">View Item</a>
              </div>
            </div>

            <!-- Quick Receipt Inline Form -->
            @if (quickReceiptItemId() === alert.item.id) {
              <div class="quick-receipt-form">
                <div class="qr-form-title">Quick Receipt — {{ alert.item.name }}</div>
                <div class="qr-fields">
                  <div class="qr-field">
                    <label class="qr-label">Quantity</label>
                    <input
                      class="qr-input"
                      type="number"
                      min="1"
                      [(ngModel)]="quickReceiptQty"
                      placeholder="e.g. 50"
                    />
                  </div>
                  <div class="qr-field">
                    <label class="qr-label">Performed By</label>
                    <input
                      class="qr-input"
                      type="text"
                      [(ngModel)]="quickReceiptBy"
                      placeholder="Full name"
                    />
                  </div>
                </div>
                <div class="qr-actions">
                  <button class="btn-primary" (click)="postQuickReceipt(alert)">Post Receipt</button>
                  <button class="btn-ghost" (click)="quickReceiptItemId.set(null)">Cancel</button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    } @else {
      <!-- Empty State -->
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <p class="empty-state-text">All stock levels are healthy.</p>
        <p class="empty-state-sub">No items are at or below their reorder point.</p>
      </div>
    }
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────────────────────────── */
    :host {
      display: block;
      font-family: 'Times New Roman', serif;
      background: #fbfbfb;
      color: #111;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 28px 28px 16px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0 0 4px;
      font-family: 'Times New Roman', serif;
      color: #111;
    }

    .page-subtitle {
      font-size: 13px;
      color: #6b7280;
      margin: 0;
      font-family: 'Times New Roman', serif;
    }

    /* ── Sub-Nav ─────────────────────────────────────────────────────────────── */
    .sub-nav {
      display: flex;
      gap: 4px;
      padding: 0 28px;
      margin-bottom: 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .sub-nav-link {
      padding: 10px 14px;
      font-size: 13px;
      font-family: 'Times New Roman', serif;
      text-decoration: none;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      white-space: nowrap;
      transition: color 0.15s;
    }

    .sub-nav-link:hover { color: #111; }

    .sub-nav-active {
      color: #111;
      border-bottom-color: #111;
      font-weight: 600;
    }

    /* ── Summary Banner ──────────────────────────────────────────────────────── */
    .summary-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      margin: 0 28px 24px;
      padding: 14px 20px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .summary-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 28px;
      padding: 0 10px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      font-family: 'Times New Roman', serif;
    }

    .summary-badge.amber {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fbbf24;
    }

    .summary-badge.red {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }

    .summary-label {
      font-size: 13px;
      color: #374151;
      font-family: 'Times New Roman', serif;
    }

    .summary-divider {
      width: 1px;
      height: 28px;
      background: #e5e7eb;
    }

    .summary-time {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;
      font-family: 'Times New Roman', serif;
      margin-left: auto;
    }

    /* ── Alert Cards ─────────────────────────────────────────────────────────── */
    .cards-list {
      padding: 0 28px 32px;
    }

    .alert-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px 18px;
      background: #fff;
      margin-bottom: 10px;
    }

    .card-header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .card-title-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .item-name {
      font-size: 16px;
      font-weight: 700;
      font-family: 'Times New Roman', serif;
      color: #111;
    }

    .item-sku {
      font-size: 12px;
      font-family: 'Courier New', Courier, monospace;
      color: #6b7280;
      letter-spacing: 0.03em;
    }

    .card-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .category-chip {
      padding: 3px 10px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      font-size: 11px;
      color: #374151;
      font-family: 'Times New Roman', serif;
      white-space: nowrap;
    }

    .severity-badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    .severity-badge.out {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }

    .severity-badge.low {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fbbf24;
    }

    /* ── Stock Bar ───────────────────────────────────────────────────────────── */
    .stock-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: #f9fafb;
      border: 1px solid #f0f0f0;
      border-radius: 6px;
      margin-bottom: 14px;
    }

    .stock-bar-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 72px;
    }

    .stock-bar-value {
      font-size: 18px;
      font-weight: 700;
      font-family: 'Times New Roman', serif;
      color: #374151;
    }

    .stock-bar-value.zero  { color: #dc2626; }
    .stock-bar-value.reorder { color: #d97706; }
    .stock-bar-value.safety  { color: #2563eb; }

    .stock-bar-label {
      font-size: 10px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: 'Times New Roman', serif;
    }

    .stock-bar-sep {
      color: #d1d5db;
      font-size: 18px;
      user-select: none;
    }

    /* ── Card Footer ─────────────────────────────────────────────────────────── */
    .card-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }

    .warehouse-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #6b7280;
      font-family: 'Times New Roman', serif;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* ── Buttons ─────────────────────────────────────────────────────────────── */
    .btn-primary {
      padding: 7px 16px;
      background: #111;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Times New Roman', serif;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-primary:hover { background: #333; }

    .btn-secondary {
      padding: 6px 14px;
      background: #fff;
      color: #111;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Times New Roman', serif;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }

    .btn-secondary:hover {
      border-color: #111;
      background: #f9fafb;
    }

    .btn-ghost {
      padding: 6px 14px;
      background: transparent;
      color: #6b7280;
      border: 1px solid transparent;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Times New Roman', serif;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      transition: color 0.15s;
    }

    .btn-ghost:hover { color: #111; }

    /* ── Quick Receipt Form ───────────────────────────────────────────────────── */
    .quick-receipt-form {
      margin-top: 14px;
      padding: 14px 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
    }

    .qr-form-title {
      font-size: 13px;
      font-weight: 600;
      font-family: 'Times New Roman', serif;
      color: #111;
      margin-bottom: 12px;
    }

    .qr-fields {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }

    .qr-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 160px;
    }

    .qr-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
      font-family: 'Times New Roman', serif;
    }

    .qr-input {
      padding: 7px 10px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 13px;
      font-family: 'Times New Roman', serif;
      background: #fff;
      color: #111;
      outline: none;
      transition: border-color 0.15s;
    }

    .qr-input:focus { border-color: #111; }

    .qr-actions {
      display: flex;
      gap: 8px;
    }

    /* ── Empty State ─────────────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 28px;
      text-align: center;
    }

    .empty-state svg {
      margin-bottom: 16px;
      opacity: 0.85;
    }

    .empty-state-text {
      font-size: 17px;
      font-weight: 600;
      font-family: 'Times New Roman', serif;
      color: #111;
      margin: 0 0 6px;
    }

    .empty-state-sub {
      font-size: 13px;
      color: #6b7280;
      font-family: 'Times New Roman', serif;
      margin: 0;
    }
  `],
})
export class AlertsPageComponent {
  protected readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc       = inject(ToastService);

  // ── Computed data ───────────────────────────────────────────────────────────
  readonly alerts = this.inventorySvc.getLowStockAlerts;

  readonly outOfStockCount = computed(() =>
    this.inventorySvc.stockLevels().filter(l => l.available === 0).length
  );

  // ── Quick Receipt state ─────────────────────────────────────────────────────
  readonly quickReceiptItemId = signal<string | null>(null);
  quickReceiptQty  = 0;
  quickReceiptBy   = '';

  // ── Timestamp ───────────────────────────────────────────────────────────────
  readonly now = new Date();

  // ── Actions ─────────────────────────────────────────────────────────────────

  openQuickReceipt(itemId: string): void {
    this.quickReceiptQty = 0;
    this.quickReceiptBy  = '';
    this.quickReceiptItemId.set(itemId);
  }

  postQuickReceipt(alert: LowStockAlert): void {
    if (!this.quickReceiptQty || this.quickReceiptQty <= 0) {
      this.toastSvc.error('Please enter a valid quantity greater than zero.');
      return;
    }
    if (!this.quickReceiptBy.trim()) {
      this.toastSvc.error('Please enter the name of the person performing the receipt.');
      return;
    }

    // Look up the warehouseId for this item
    const level = this.inventorySvc.stockLevels()
      .find(l => l.itemId === alert.item.id);
    const warehouseId = level?.warehouseId ?? 'WH-001';

    const movement: StockMovement = {
      id:          `MOV-${Date.now()}`,
      itemId:      alert.item.id,
      warehouseId,
      type:        'RECEIPT',
      quantity:    this.quickReceiptQty,
      reference:   `QR-${Date.now()}`,
      reason:      'Quick Receipt from Alerts page',
      performedBy: this.quickReceiptBy.trim(),
      createdAt:   new Date().toISOString(),
      notes:       '',
    };

    this.inventorySvc.addMovement(movement);
    this.toastSvc.success(
      `Receipt of ${this.quickReceiptQty} unit(s) posted for "${alert.item.name}".`
    );

    this.quickReceiptItemId.set(null);
    this.quickReceiptQty = 0;
    this.quickReceiptBy  = '';
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  warehouseName(itemId: string): string {
    const level = this.inventorySvc.stockLevels()
      .find(l => l.itemId === itemId);
    if (!level) return '—';
    const wh = this.inventorySvc.warehouses
      .find(w => w.id === level.warehouseId);
    return wh?.name ?? level.warehouseId;
  }

  categoryLabel(cat: string): string {
    return CATEGORY_LABELS[cat] ?? cat;
  }
}
