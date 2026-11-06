import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from './inventory.service';
import { ToastService } from '../../core/services/toast.service';
import {
  InventoryItem,
  InventoryCategory,
  MovementType,
  AdjustmentReason,
  StockMovement,
  UnitOfMeasure,
} from './inventory.model';

type StockFilter = 'ALL' | 'LOW' | 'OK' | 'OUT';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<!-- ── Page Header ─────────────────────────────────────── -->
<div class="inv-page">
  <header class="inv-header">
    <div class="inv-header-left">
      <h1 class="inv-title">Inventory</h1>
      <span class="inv-subtitle">Stock master &amp; movement ledger</span>
    </div>
    <div class="inv-header-actions">
      <button class="btn-primary" (click)="toggleAddItemForm()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Item
      </button>
    </div>
  </header>

  <!-- ── Sub-nav ────────────────────────────────────────── -->
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

  <!-- ── KPI Strip ───────────────────────────────────────── -->
  <section class="kpi-strip">
    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-blue">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ kpi().totalItems }}</div>
        <div class="kpi-label">Total Items</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon-wrap" [class.kpi-red]="kpi().lowStockCount > 0" [class.kpi-green]="kpi().lowStockCount === 0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value" [style.color]="kpi().lowStockCount > 0 ? '#dc2626' : 'inherit'">{{ kpi().lowStockCount }}</div>
        <div class="kpi-label">Low Stock Alerts</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-amber">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">{{ kpi().inTransitCount }}</div>
        <div class="kpi-label">Units In Transit</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon-wrap kpi-green">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">₦{{ formatNaira(kpi().totalValueNaira) }}</div>
        <div class="kpi-label">Total Stock Value</div>
      </div>
    </div>
  </section>

  <!-- ── Add Item Form ────────────────────────────────────── -->
  @if (showAddItemForm()) {
    <section class="form-panel">
      <div class="form-panel-header">
        <h2 class="form-panel-title">New Inventory Item</h2>
        <button class="icon-btn" (click)="toggleAddItemForm()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label class="form-label">Item Name *</label>
          <input class="form-input" type="text" [(ngModel)]="newItem.name" placeholder="e.g. Rice 50kg Bag" />
        </div>
        <div class="form-field">
          <label class="form-label">SKU *</label>
          <input class="form-input" type="text" [(ngModel)]="newItem.sku" placeholder="e.g. FBV-RCE-50K" />
        </div>
        <div class="form-field">
          <label class="form-label">Category *</label>
          <select class="form-select" [(ngModel)]="newItem.category">
            <option value="">— Select —</option>
            @for (cat of categories; track cat.value) {
              <option [value]="cat.value">{{ cat.label }}</option>
            }
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Unit of Measure *</label>
          <select class="form-select" [(ngModel)]="newItem.unitOfMeasure">
            <option value="">— Select —</option>
            @for (uom of uomOptions; track uom) {
              <option [value]="uom">{{ uom }}</option>
            }
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Weight (kg)</label>
          <input class="form-input" type="number" [(ngModel)]="newItem.weightKg" min="0" placeholder="0" />
        </div>
        <div class="form-field">
          <label class="form-label">Unit Cost (₦)</label>
          <input class="form-input" type="number" [(ngModel)]="newItem.unitCostNaira" min="0" placeholder="0" />
        </div>
        <div class="form-field">
          <label class="form-label">Reorder Point</label>
          <input class="form-input" type="number" [(ngModel)]="newItem.reorderPoint" min="0" placeholder="0" />
        </div>
        <div class="form-field">
          <label class="form-label">Safety Stock</label>
          <input class="form-input" type="number" [(ngModel)]="newItem.safetyStock" min="0" placeholder="0" />
        </div>
        <div class="form-field form-field-full">
          <label class="form-label">Description</label>
          <input class="form-input" type="text" [(ngModel)]="newItem.description" placeholder="Brief product description" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-secondary" (click)="toggleAddItemForm()">Cancel</button>
        <button class="btn-primary" (click)="submitAddItem()">Save Item</button>
      </div>
    </section>
  }

  <!-- ── Low-Stock Alerts Panel ─────────────────────────── -->
  @if (lowStockAlerts().length > 0) {
    <section class="alerts-panel">
      <div class="alerts-header" (click)="alertsExpanded.set(!alertsExpanded())">
        <div class="alerts-title-group">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span class="alerts-title">Low Stock Alerts</span>
          <span class="alerts-badge">{{ lowStockAlerts().length }}</span>
        </div>
        <svg class="alerts-chevron" [class.alerts-chevron-open]="alertsExpanded()"
             width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      @if (alertsExpanded()) {
        <div class="alerts-list">
          @for (alert of lowStockAlerts(); track alert.item.id) {
            <div class="alert-row">
              <div class="alert-item-info">
                <div class="alert-item-name">{{ alert.item.name }}</div>
                <div class="alert-item-sku muted">{{ alert.item.sku }}</div>
              </div>
              <div class="alert-stock">
                <span class="badge badge-low">{{ alert.currentStock }} avail.</span>
                <span class="muted">/ {{ alert.reorderPoint }} reorder pt</span>
              </div>
              <button class="btn-xs" (click)="quickRecordMovement(alert.item.id); $event.stopPropagation()">
                Record Receipt
              </button>
            </div>
          }
        </div>
      }
    </section>
  }

  <!-- ── Filter Bar ───────────────────────────────────────── -->
  <div class="filter-bar">
    <div class="search-wrap">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input class="search-input" type="text" [(ngModel)]="searchQuery" placeholder="Search by name or SKU…" />
    </div>
    <select class="filter-select" [(ngModel)]="categoryFilter">
      <option value="">All Categories</option>
      @for (cat of categories; track cat.value) {
        <option [value]="cat.value">{{ cat.label }}</option>
      }
    </select>
    <select class="filter-select" [ngModel]="warehouseFilter()" (ngModelChange)="warehouseFilter.set($event)">
      <option value="">All Warehouses</option>
      @for (wh of warehouseOptions; track wh.id) {
        <option [value]="wh.id">{{ wh.name }}</option>
      }
    </select>
    <div class="status-tabs">
      @for (tab of statusTabs; track tab.value) {
        <button class="status-tab" [class.active]="stockFilter() === tab.value" (click)="stockFilter.set(tab.value)">
          {{ tab.label }}
        </button>
      }
    </div>
  </div>

  <!-- ── Items Table ──────────────────────────────────────── -->
  <section class="table-section">
    <div class="table-wrap">
      <table class="inv-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>UoM</th>
            <th class="num-col">On Hand</th>
            <th class="num-col">Reserved</th>
            <th class="num-col">Available</th>
            <th class="num-col">In Transit</th>
            <th class="num-col">Reorder Pt</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of filteredItems(); track row.id) {
            <tr class="inv-row" [class.inv-row-selected]="selectedItemId() === row.id" (click)="selectItem(row.id)">
              <td class="sku-cell">{{ row.sku }}</td>
              <td class="name-cell">{{ row.name }}</td>
              <td><span class="cat-chip">{{ categoryLabel(row.category) }}</span></td>
              <td class="muted">{{ row.unitOfMeasure }}</td>
              <td class="num-col">{{ stockFor(row.id)?.onHand ?? 0 }}</td>
              <td class="num-col muted">{{ stockFor(row.id)?.reserved ?? 0 }}</td>
              <td class="num-col">{{ stockFor(row.id)?.available ?? 0 }}</td>
              <td class="num-col muted">{{ stockFor(row.id)?.inTransit ?? 0 }}</td>
              <td class="num-col muted">{{ row.reorderPoint }}</td>
              <td><span class="badge" [class]="statusBadgeClass(row.id)">{{ statusLabel(row.id) }}</span></td>
              <td>
                <button class="btn-xs" (click)="selectItem(row.id); $event.stopPropagation()">
                  {{ selectedItemId() === row.id ? 'Hide' : 'View' }}
                </button>
              </td>
            </tr>

            <!-- ── Inline detail panel ───────────────────────── -->
            @if (selectedItemId() === row.id) {
              <tr class="detail-row">
                <td colspan="11">
                  <div class="detail-panel">

                    <!-- Item meta -->
                    <div class="detail-meta">
                      <div>
                        <div class="detail-label">Description</div>
                        <div>{{ row.description || '—' }}</div>
                      </div>
                      <div>
                        <div class="detail-label">Weight</div>
                        <div>{{ row.weightKg }} kg</div>
                      </div>
                      <div>
                        <div class="detail-label">Unit Cost</div>
                        <div>₦{{ formatNaira(row.unitCostNaira) }}</div>
                      </div>
                      <div>
                        <div class="detail-label">Safety Stock</div>
                        <div>{{ row.safetyStock }}</div>
                      </div>
                    </div>

                    <!-- Record movement -->
                    <div class="detail-actions-bar">
                      <h3 class="detail-section-title">Stock Movements</h3>
                      <button class="btn-primary btn-sm" (click)="openMovementForm(row.id)">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Record Movement
                      </button>
                    </div>

                    @if (showMovementForm() && movementItemId() === row.id) {
                      <div class="movement-form">
                        <div class="form-grid form-grid-sm">
                          <div class="form-field">
                            <label class="form-label">Type</label>
                            <select class="form-select" [(ngModel)]="newMovement.type">
                              @for (mt of movementTypes; track mt.value) {
                                <option [value]="mt.value">{{ mt.label }}</option>
                              }
                            </select>
                          </div>
                          @if (newMovement.type === 'ADJUSTMENT') {
                            <div class="form-field">
                              <label class="form-label">Reason</label>
                              <select class="form-select" [(ngModel)]="newMovement.adjustmentReason">
                                <option value="">— Select reason —</option>
                                @for (r of adjustmentReasons; track r.value) {
                                  <option [value]="r.value">{{ r.label }}</option>
                                }
                              </select>
                            </div>
                          }
                          <div class="form-field">
                            <label class="form-label">Quantity</label>
                            <input class="form-input" type="number" [(ngModel)]="newMovement.quantity" min="1" placeholder="0" />
                          </div>
                          <div class="form-field">
                            <label class="form-label">Reference</label>
                            <input class="form-input" type="text" [(ngModel)]="newMovement.reference" placeholder="PO / Order No." />
                          </div>
                          <div class="form-field">
                            <label class="form-label">Performed By</label>
                            <input class="form-input" type="text" [(ngModel)]="newMovement.performedBy" placeholder="Officer name" />
                          </div>
                          <div class="form-field form-field-full">
                            <label class="form-label">Notes</label>
                            <input class="form-input" type="text" [(ngModel)]="newMovement.notes" placeholder="Optional notes" />
                          </div>
                        </div>
                        <div class="form-actions">
                          <button class="btn-secondary btn-sm" (click)="showMovementForm.set(false)">Cancel</button>
                          <button class="btn-primary btn-sm" (click)="submitMovement(row.id)">Save Movement</button>
                        </div>
                      </div>
                    }

                    <!-- Ledger table -->
                    <div class="ledger-wrap">
                      <table class="ledger-table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th class="num-col">Qty</th>
                            <th>Reference</th>
                            <th>Performed By</th>
                            <th>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (mv of movementsFor(row.id); track mv.id) {
                            <tr>
                              <td class="muted">{{ mv.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                              <td><span class="mv-badge" [class]="movementBadgeClass(mv.type)">{{ mv.type }}</span></td>
                              <td class="num-col" [style.color]="mv.type === 'DISPATCH' ? '#dc2626' : (mv.type === 'RECEIPT' || mv.type === 'RETURN' ? '#16a34a' : 'inherit')">
                                {{ mv.type === 'DISPATCH' ? '-' : '+' }}{{ mv.quantity }}
                              </td>
                              <td class="sku-cell">{{ mv.reference }}</td>
                              <td>{{ mv.performedBy }}</td>
                              <td class="muted">{{ mv.notes || '—' }}</td>
                            </tr>
                          }
                          @if (movementsFor(row.id).length === 0) {
                            <tr>
                              <td colspan="6" class="empty-state">No movements recorded yet.</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>

                  </div>
                </td>
              </tr>
            }
          }

          @if (filteredItems().length === 0) {
            <tr>
              <td colspan="11">
                <div class="empty-full">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  <div class="empty-title">No items match your filters</div>
                  <div class="empty-desc">Try adjusting your search or filters.</div>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </section>
</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; }

    /* ── Layout ───────────────────────────────────────────── */
    .inv-page { padding: 24px 28px; background: #fbfbfb; min-height: 100vh; }

    /* ── Header ───────────────────────────────────────────── */
    .inv-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 16px;
    }
    .inv-title { font-size: 22px; font-weight: 700; color: #111; margin: 0 0 2px; letter-spacing: -0.3px; }
    .inv-subtitle { font-size: 12px; color: #6b7280; }
    .inv-header-actions { display: flex; gap: 8px; }

    /* ── Sub-nav ──────────────────────────────────────────── */
    .sub-nav { display: flex; gap: 4px; margin: 0 -28px 20px; padding: 0 28px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
    .sub-nav-link { padding: 10px 14px; font-size: 13px; font-family: 'Times New Roman', serif; text-decoration: none; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color 0.15s; }
    .sub-nav-link:hover { color: #111; }
    .sub-nav-active { color: #111 !important; border-bottom-color: #111 !important; font-weight: 600; }

    /* ── KPI Strip ────────────────────────────────────────── */
    .kpi-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    }
    .kpi-icon-wrap {
      width: 36px; height: 36px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-blue  { background: #eff6ff; color: #2563eb; }
    .kpi-red   { background: #fef2f2; color: #dc2626; }
    .kpi-amber { background: #fffbeb; color: #d97706; }
    .kpi-green { background: #f0fdf4; color: #16a34a; }
    .kpi-value { font-size: 18px; font-weight: 700; color: #111; line-height: 1.1; }
    .kpi-label { font-size: 11px; color: #6b7280; margin-top: 2px; }

    /* ── Alerts Panel ─────────────────────────────────────── */
    .alerts-panel {
      background: #fff; border: 1px solid #fcd34d; border-radius: 8px;
      margin-bottom: 16px; overflow: hidden;
    }
    .alerts-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; cursor: pointer; user-select: none;
      background: #fffbeb;
    }
    .alerts-header:hover { background: #fef3c7; }
    .alerts-title-group { display: flex; align-items: center; gap: 8px; }
    .alerts-title { font-size: 13px; font-weight: 700; color: #92400e; }
    .alerts-badge {
      background: #d97706; color: #fff;
      font-size: 11px; font-weight: 700; padding: 1px 7px;
      border-radius: 999px; min-width: 20px; text-align: center;
    }
    .alerts-chevron { color: #92400e; transition: transform 0.2s; flex-shrink: 0; }
    .alerts-chevron-open { transform: rotate(180deg); }
    .alerts-list { border-top: 1px solid #fcd34d; }
    .alert-row {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 14px; border-bottom: 1px solid #fef3c7;
    }
    .alert-row:last-child { border-bottom: none; }
    .alert-item-info { flex: 1; min-width: 0; }
    .alert-item-name { font-size: 13px; font-weight: 600; color: #111; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .alert-item-sku { font-size: 11px; font-family: 'Courier New', monospace; }
    .alert-stock { display: flex; align-items: center; gap: 6px; white-space: nowrap; }

    /* ── Filter Bar ───────────────────────────────────────── */
    .filter-bar {
      display: flex; align-items: center; gap: 10px; margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .search-wrap {
      display: flex; align-items: center; gap: 7px;
      border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px;
      background: #fff; flex: 1; min-width: 200px; max-width: 320px;
    }
    .search-wrap svg { color: #9ca3af; flex-shrink: 0; }
    .search-input { border: none; outline: none; background: transparent; font-size: 13px; font-family: inherit; width: 100%; }
    .filter-select {
      border: 1px solid #e5e7eb; border-radius: 6px; padding: 6px 10px;
      font-size: 13px; font-family: inherit; background: #fff; color: #374151;
      outline: none; cursor: pointer;
    }
    .status-tabs { display: flex; gap: 2px; background: #f3f4f6; border-radius: 6px; padding: 2px; }
    .status-tab {
      padding: 5px 12px; font-size: 12px; font-family: inherit;
      border: none; background: transparent; border-radius: 4px; cursor: pointer;
      color: #6b7280; font-weight: 500; transition: all 0.15s;
    }
    .status-tab.active { background: #fff; color: #111; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }

    /* ── Buttons ──────────────────────────────────────────── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 14px; background: #111; color: #fff;
      border: none; border-radius: 6px; font-size: 13px; font-family: inherit;
      cursor: pointer; font-weight: 600; transition: background 0.15s;
    }
    .btn-primary:hover { background: #374151; }
    .btn-primary.btn-sm { padding: 5px 11px; font-size: 12px; }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 7px 14px; background: #fff; color: #374151;
      border: 1px solid #e5e7eb; border-radius: 6px; font-size: 13px; font-family: inherit;
      cursor: pointer; font-weight: 500; transition: background 0.15s;
    }
    .btn-secondary:hover { background: #f9fafb; }
    .btn-secondary.btn-sm { padding: 5px 11px; font-size: 12px; }
    .btn-xs {
      padding: 4px 10px; font-size: 11px; font-family: inherit;
      border: 1px solid #e5e7eb; border-radius: 5px; background: #fff;
      color: #374151; cursor: pointer; transition: background 0.15s;
    }
    .btn-xs:hover { background: #f3f4f6; }
    .icon-btn {
      background: transparent; border: none; cursor: pointer; padding: 4px;
      color: #6b7280; display: flex; align-items: center;
    }
    .icon-btn:hover { color: #111; }

    /* ── Form Panel ───────────────────────────────────────── */
    .form-panel {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 20px; margin-bottom: 20px;
    }
    .form-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .form-panel-title { font-size: 15px; font-weight: 700; color: #111; margin: 0; }
    .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .form-grid-sm { grid-template-columns: repeat(3, 1fr); }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-field-full { grid-column: 1 / -1; }
    .form-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input, .form-select {
      border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px;
      font-size: 13px; font-family: inherit; background: #fff; color: #111;
      outline: none; transition: border-color 0.15s;
    }
    .form-input:focus, .form-select:focus { border-color: #9ca3af; }
    .form-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

    /* ── Movement Form ────────────────────────────────────── */
    .movement-form {
      background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;
      padding: 14px; margin-bottom: 14px;
    }

    /* ── Table ────────────────────────────────────────────── */
    .table-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .inv-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .inv-table thead { border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
    .inv-table th {
      padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600;
      color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; white-space: nowrap;
    }
    .inv-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .inv-row { cursor: pointer; transition: background 0.1s; }
    .inv-row:hover { background: #f9fafb; }
    .inv-row-selected { background: #f0f9ff !important; }
    .num-col { text-align: right; }
    .sku-cell { font-family: 'Courier New', monospace; font-size: 12px; color: #374151; }
    .name-cell { font-weight: 600; color: #111; }
    .muted { color: #6b7280; }

    /* ── Badges ───────────────────────────────────────────── */
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-ok  { background: #dcfce7; color: #16a34a; }
    .badge-low { background: #fef3c7; color: #d97706; }
    .badge-out { background: #fee2e2; color: #dc2626; }
    .cat-chip {
      display: inline-block; padding: 2px 7px; border-radius: 4px;
      font-size: 11px; background: #f3f4f6; color: #374151;
    }
    .mv-badge { display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .mv-receipt    { background: #dcfce7; color: #16a34a; }
    .mv-dispatch   { background: #fee2e2; color: #dc2626; }
    .mv-adjustment { background: #ede9fe; color: #7c3aed; }
    .mv-transfer   { background: #dbeafe; color: #2563eb; }
    .mv-return     { background: #fef3c7; color: #d97706; }

    /* ── Detail Panel ─────────────────────────────────────── */
    .detail-row td { padding: 0; border-bottom: 1px solid #e5e7eb; }
    .detail-panel { padding: 16px 20px; background: #fafafa; }
    .detail-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .detail-label { font-size: 10px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
    .detail-actions-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .detail-section-title { font-size: 13px; font-weight: 700; color: #111; margin: 0; }

    /* ── Ledger Table ─────────────────────────────────────── */
    .ledger-wrap { overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 6px; }
    .ledger-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .ledger-table thead { background: #f3f4f6; }
    .ledger-table th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; }
    .ledger-table td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .ledger-table tr:last-child td { border-bottom: none; }

    /* ── Empty States ─────────────────────────────────────── */
    .empty-state { text-align: center; color: #9ca3af; padding: 20px; }
    .empty-full { display: flex; flex-direction: column; align-items: center; padding: 48px 20px; gap: 8px; }
    .empty-title { font-size: 15px; font-weight: 600; color: #374151; }
    .empty-desc { font-size: 13px; color: #9ca3af; }

    @media (max-width: 1100px) {
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
      .form-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-meta { grid-template-columns: repeat(2, 1fr); }
    }
  `],
})
export class InventoryListComponent {
  private readonly inventoryService = inject(InventoryService);
  private readonly toastService = inject(ToastService);

  // ── State ────────────────────────────────────────────────
  readonly showAddItemForm = signal(false);
  readonly showMovementForm = signal(false);
  readonly selectedItemId = signal<string | null>(null);
  readonly movementItemId = signal<string | null>(null);
  readonly stockFilter = signal<StockFilter>('ALL');
  readonly warehouseFilter = signal<string>('');
  readonly alertsExpanded = signal(true);

  searchQuery = '';
  categoryFilter = '';

  // ── KPI (live) ───────────────────────────────────────────
  readonly kpi = this.inventoryService.getDashboardKpi;

  // ── Low-stock alerts (live) ──────────────────────────────
  readonly lowStockAlerts = this.inventoryService.getLowStockAlerts;

  // ── Warehouse options ────────────────────────────────────
  readonly warehouseOptions = this.inventoryService.warehouses;

  // ── Computed filtered list ───────────────────────────────
  readonly filteredItems = computed(() => {
    const items = this.inventoryService.items();
    const levels = this.inventoryService.stockLevels();
    const q = this.searchQuery.toLowerCase();
    const catF = this.categoryFilter;
    const statusF = this.stockFilter();
    const whF = this.warehouseFilter();

    return items.filter(item => {
      if (q && !item.name.toLowerCase().includes(q) && !item.sku.toLowerCase().includes(q)) return false;
      if (catF && item.category !== catF) return false;
      if (whF) {
        const hasStock = levels.some(l => l.itemId === item.id && l.warehouseId === whF);
        if (!hasStock) return false;
      }
      if (statusF !== 'ALL') {
        const level = levels.find(l => l.itemId === item.id);
        const avail = level?.available ?? 0;
        if (statusF === 'OUT' && avail !== 0) return false;
        if (statusF === 'LOW' && (avail === 0 || avail > item.reorderPoint)) return false;
        if (statusF === 'OK' && avail <= item.reorderPoint) return false;
      }
      return true;
    });
  });

  // ── Static options ────────────────────────────────────────
  readonly categories: { value: InventoryCategory; label: string }[] = [
    { value: 'FOOD_AND_BEVERAGE',  label: 'Food & Beverage' },
    { value: 'BUILDING_MATERIALS', label: 'Building Materials' },
    { value: 'PHARMACEUTICALS',    label: 'Pharmaceuticals' },
    { value: 'ELECTRONICS',        label: 'Electronics' },
    { value: 'AUTOMOTIVE_PARTS',   label: 'Automotive Parts' },
    { value: 'CHEMICALS',          label: 'Chemicals' },
    { value: 'TEXTILES',           label: 'Textiles' },
    { value: 'AGRICULTURAL',       label: 'Agricultural' },
    { value: 'GENERAL_MERCHANDISE',label: 'General Merchandise' },
  ];

  readonly uomOptions: UnitOfMeasure[] = ['BAG', 'CARTON', 'PALLET', 'KG', 'LITRE', 'PIECE', 'TON', 'ROLL', 'DRUM', 'CRATE'];

  readonly statusTabs: { value: StockFilter; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'LOW', label: 'Low Stock' },
    { value: 'OUT', label: 'Out of Stock' },
    { value: 'OK',  label: 'OK' },
  ];

  readonly movementTypes: { value: MovementType; label: string }[] = [
    { value: 'RECEIPT',    label: 'Receipt' },
    { value: 'DISPATCH',   label: 'Dispatch' },
    { value: 'RETURN',     label: 'Return' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'TRANSFER',   label: 'Transfer' },
  ];

  readonly adjustmentReasons: { value: AdjustmentReason; label: string }[] = [
    { value: 'THEFT',          label: 'Theft' },
    { value: 'DAMAGE',         label: 'Damage' },
    { value: 'EXPIRY',         label: 'Expiry / Expired' },
    { value: 'COUNTING_ERROR', label: 'Counting Error' },
    { value: 'SUPPLIER_RETURN',label: 'Supplier Return' },
    { value: 'WRITE_OFF',      label: 'Write-Off' },
    { value: 'OTHER',          label: 'Other' },
  ];

  // ── New item form state ───────────────────────────────────
  newItem: Partial<InventoryItem> & { name: string; sku: string } = this.blankItem();

  // ── New movement form state ───────────────────────────────
  newMovement: { type: MovementType; quantity: number; reference: string; performedBy: string; notes: string; adjustmentReason: AdjustmentReason | '' } = this.blankMovement();

  // ── Helpers ───────────────────────────────────────────────
  stockFor(itemId: string) {
    return this.inventoryService.getItemStockLevel(itemId);
  }

  movementsFor(itemId: string) {
    return this.inventoryService.getMovementsForItem(itemId);
  }

  statusLabel(itemId: string): string {
    const item = this.inventoryService.items().find(i => i.id === itemId);
    if (!item) return '';
    const avail = this.stockFor(itemId)?.available ?? 0;
    if (avail === 0) return 'Out';
    if (avail <= item.reorderPoint) return 'Low Stock';
    return 'OK';
  }

  statusBadgeClass(itemId: string): string {
    const label = this.statusLabel(itemId);
    if (label === 'Out') return 'badge badge-out';
    if (label === 'Low Stock') return 'badge badge-low';
    return 'badge badge-ok';
  }

  movementBadgeClass(type: MovementType): string {
    const map: Record<MovementType, string> = {
      RECEIPT: 'mv-badge mv-receipt',
      DISPATCH: 'mv-badge mv-dispatch',
      ADJUSTMENT: 'mv-badge mv-adjustment',
      TRANSFER: 'mv-badge mv-transfer',
      RETURN: 'mv-badge mv-return',
    };
    return map[type];
  }

  categoryLabel(cat: InventoryCategory): string {
    return this.categories.find(c => c.value === cat)?.label ?? cat;
  }

  formatNaira(value: number): string {
    if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + 'B';
    if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + 'M';
    if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K';
    return value.toLocaleString('en-NG');
  }

  // ── Actions ───────────────────────────────────────────────
  toggleAddItemForm() {
    this.showAddItemForm.update(v => !v);
    if (!this.showAddItemForm()) this.newItem = this.blankItem();
  }

  selectItem(id: string) {
    if (this.selectedItemId() === id) {
      this.selectedItemId.set(null);
      this.showMovementForm.set(false);
    } else {
      this.selectedItemId.set(id);
      this.showMovementForm.set(false);
    }
  }

  openMovementForm(itemId: string) {
    this.movementItemId.set(itemId);
    this.showMovementForm.set(true);
    this.newMovement = this.blankMovement();
  }

  /** Quick action from the alerts panel: select the item and open the movement form */
  quickRecordMovement(itemId: string) {
    // Ensure the item is expanded in the table
    this.selectedItemId.set(itemId);
    this.openMovementForm(itemId);
  }

  submitAddItem() {
    const { name, sku, category, unitOfMeasure } = this.newItem;
    if (!name?.trim() || !sku?.trim() || !category || !unitOfMeasure) {
      this.toastService.warning('Please fill in all required fields (Name, SKU, Category, UoM).');
      return;
    }
    const item: InventoryItem = {
      id: 'ITEM-' + Date.now(),
      sku: sku.trim(),
      name: name.trim(),
      category: category as InventoryCategory,
      weightKg: this.newItem.weightKg ?? 0,
      unitOfMeasure: unitOfMeasure as UnitOfMeasure,
      photos: [],
      description: this.newItem.description ?? '',
      reorderPoint: this.newItem.reorderPoint ?? 0,
      safetyStock: this.newItem.safetyStock ?? 0,
      unitCostNaira: this.newItem.unitCostNaira ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.inventoryService.addItem(item);
    this.toastService.success(`Item "${item.name}" added to inventory.`);
    this.showAddItemForm.set(false);
    this.newItem = this.blankItem();
  }

  submitMovement(itemId: string) {
    const { type, quantity, reference, performedBy } = this.newMovement;
    if (!quantity || quantity <= 0) {
      this.toastService.warning('Quantity must be greater than zero.');
      return;
    }
    const movement: StockMovement = {
      id: 'MOV-' + Date.now(),
      itemId,
      warehouseId: this.inventoryService.getItemStockLevel(itemId)?.warehouseId ?? 'WH-001',
      type,
      quantity,
      reference: reference.trim() || '—',
      reason: type,
      performedBy: performedBy.trim() || 'System',
      createdAt: new Date().toISOString(),
      notes: this.newMovement.notes,
      adjustmentReason: this.newMovement.adjustmentReason || undefined,
    };
    this.inventoryService.addMovement(movement);
    this.toastService.success(`${type} of ${quantity} units recorded.`);
    this.showMovementForm.set(false);
    this.newMovement = this.blankMovement();
  }

  // ── Blank templates ───────────────────────────────────────
  private blankItem(): Partial<InventoryItem> & { name: string; sku: string } {
    return {
      name: '', sku: '', category: undefined, unitOfMeasure: undefined,
      weightKg: 0, unitCostNaira: 0, reorderPoint: 0, safetyStock: 0, description: '',
    };
  }

  private blankMovement() {
    return { type: 'RECEIPT' as MovementType, quantity: 0, reference: '', performedBy: '', notes: '', adjustmentReason: '' as AdjustmentReason | '' };
  }
}
