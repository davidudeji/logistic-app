import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StockMovement } from '../../inventory.model';

// ─── Local Interfaces ─────────────────────────────────────────────────────────

interface DispatchOrderLine {
  itemId: string;
  itemName: string;
  sku: string;
  orderedQty: number;
}

interface DispatchOrder {
  id: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  lines: DispatchOrderLine[];
  status: 'DRAFT' | 'CONFIRMED' | 'PICKING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  reference: string;
  notes: string;
  createdAt: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_ORDERS: DispatchOrder[] = [
  {
    id: 'DO-001',
    customerId: 'CUST-10021',
    customerName: 'Eko Supermarket Ltd',
    warehouseId: 'WH-001',
    warehouseName: 'Lagos Central Depot',
    lines: [
      { itemId: 'ITEM-001', itemName: 'Rice (50kg Bag)',       sku: 'FBV-RCE-50K', orderedQty: 20 },
      { itemId: 'ITEM-006', itemName: 'Coca-Cola 50cl (Carton)', sku: 'FBV-BEV-CRT', orderedQty: 30 },
    ],
    status: 'CONFIRMED',
    reference: 'DO-2026-0041',
    notes: 'Deliver before noon. Fragile cartons on top.',
    createdAt: '2026-11-04T09:15:00Z',
  },
  {
    id: 'DO-002',
    customerId: 'CUST-10035',
    customerName: 'Kano Farmers Cooperative',
    warehouseId: 'WH-002',
    warehouseName: 'Kano Northern Hub',
    lines: [
      { itemId: 'ITEM-007', itemName: 'NPK Fertiliser (50kg)', sku: 'AGR-FRT-50K', orderedQty: 80 },
      { itemId: 'ITEM-003', itemName: 'Amoxicillin 500mg (Carton)', sku: 'PHR-AML-500', orderedQty: 5 },
    ],
    status: 'PICKING',
    reference: 'DO-2026-0042',
    notes: '',
    createdAt: '2026-11-05T07:30:00Z',
  },
  {
    id: 'DO-003',
    customerId: 'CUST-10048',
    customerName: 'Abuja General Hospital',
    warehouseId: 'WH-003',
    warehouseName: 'Abuja FCT Store',
    lines: [
      { itemId: 'ITEM-004', itemName: 'Generator 10KVA (Sumec)', sku: 'ELC-GEN-10KV', orderedQty: 1 },
      { itemId: 'ITEM-005', itemName: 'Truck Tyre 225/75R17.5',  sku: 'AUT-TYR-225',  orderedQty: 4 },
      { itemId: 'ITEM-008', itemName: 'Engine Oil (20L Drum)',   sku: 'CHM-LUB-20L',  orderedQty: 6 },
    ],
    status: 'DRAFT',
    reference: 'DO-2026-0043',
    notes: 'Government purchase order attached.',
    createdAt: '2026-11-06T08:00:00Z',
  },
];

@Component({
  selector: 'app-dispatch-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  styles: [`
    :host { display: block; font-family: 'Times New Roman', serif; color: #111; background: #fbfbfb; }

    /* ── Page header ── */
    .page-header          { padding: 24px 28px 20px; border-bottom: 1px solid #e5e7eb; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .page-title           { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    .page-sub             { font-size: 13px; color: #6b7280; margin: 0; }

    /* ── Sub-nav ── */
    .sub-nav              { display: flex; gap: 4px; padding: 0 28px; border-bottom: 1px solid #e5e7eb; overflow-x: auto; margin-bottom: 0; }
    .sub-nav-link         { padding: 10px 14px; font-size: 13px; font-family: 'Times New Roman', serif; text-decoration: none; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: color .15s; }
    .sub-nav-link:hover   { color: #111; }
    .sub-nav-active       { color: #111 !important; border-bottom-color: #111 !important; font-weight: 600; }

    /* ── Main content area ── */
    .content              { padding: 24px 28px 40px; }

    /* ── KPI strip ── */
    .kpi-strip            { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .kpi-card             { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
    .kpi-icon             { font-size: 24px; flex-shrink: 0; }
    .kpi-label            { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: 0 0 4px; }
    .kpi-value            { font-size: 24px; font-weight: 700; margin: 0; line-height: 1; }
    .kpi-sub              { font-size: 11px; color: #9ca3af; margin: 2px 0 0; }

    /* ── Buttons ── */
    .btn-primary          { background: #111; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s; }
    .btn-primary:hover    { background: #333; }
    .btn-primary:disabled { opacity: .45; cursor: default; }
    .btn-secondary        { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 20px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; transition: background .15s; }
    .btn-secondary:hover  { background: #f9fafb; }
    .btn-sm               { padding: 5px 12px; font-size: 12px; }
    .btn-danger           { background: #fff; color: #991b1b; border: 1px solid #fca5a5; padding: 5px 12px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 12px; cursor: pointer; transition: background .15s; }
    .btn-danger:hover     { background: #fee2e2; }

    /* ── Create form slide-in panel ── */
    .form-panel           { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; margin-bottom: 24px; background: #fff; }
    .form-panel-header    { padding: 14px 18px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
    .form-panel-title     { font-size: 15px; font-weight: 700; margin: 0; }
    .form-panel-body      { padding: 20px 18px; }

    .field-grid-3         { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 14px; }
    .field-grid-2         { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 14px; }
    .field-full           { grid-column: 1 / -1; }
    .field-group          { display: flex; flex-direction: column; gap: 4px; }
    .field-label          { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    .field-input,
    .field-select         { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; font-family: 'Times New Roman', serif; font-size: 13px; width: 100%; box-sizing: border-box; background: #fff; color: #111; }
    .field-input:focus,
    .field-select:focus   { outline: none; border-color: #111; }
    .field-input:disabled,
    .field-select:disabled { background: #f9fafb; color: #9ca3af; cursor: not-allowed; }

    /* ── Line items builder ── */
    .lines-section        { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 14px; }
    .lines-header         { padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
    .lines-header-title   { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: 0; }
    .lines-adder          { padding: 12px 14px; display: grid; grid-template-columns: 1fr 100px auto; gap: 10px; align-items: flex-end; border-bottom: 1px solid #f3f4f6; }
    .lines-table          { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lines-table th       { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 8px 12px; border-bottom: 1px solid #e5e7eb; background: #fff; }
    .lines-table td       { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .lines-table tr:last-child td { border-bottom: none; }
    .lines-empty          { padding: 20px; text-align: center; color: #9ca3af; font-size: 13px; }

    .stock-hint           { font-size: 11px; color: #6b7280; }
    .stock-warn           { color: #dc2626; }

    .form-btn-row         { display: flex; gap: 10px; margin-top: 6px; flex-wrap: wrap; }

    /* ── Orders table ── */
    .table-card           { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .table-toolbar        { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; gap: 10px; }
    .table-title          { font-size: 14px; font-weight: 700; margin: 0; }
    .orders-table         { width: 100%; border-collapse: collapse; font-size: 13px; }
    .orders-table th      { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; white-space: nowrap; background: #fff; }
    .orders-table td      { padding: 10px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; color: #374151; }
    .orders-table tr.data-row:hover td { background: #f9fafb; }
    .orders-table tr.data-row { cursor: pointer; }
    .orders-table tr.detail-row td { padding: 0; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
    .orders-table tr.data-row.expanded td { background: #f9fafb; }

    .order-id             { font-weight: 600; font-size: 12px; color: #111; }
    .order-ref            { font-size: 11px; color: #9ca3af; }
    .customer-name        { font-weight: 500; }
    .customer-id          { font-size: 11px; color: #9ca3af; }

    /* ── Status badges ── */
    .badge                { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
    .badge-draft          { background: #f3f4f6; color: #374151; }
    .badge-confirmed      { background: #dbeafe; color: #1d4ed8; }
    .badge-picking        { background: #fef3c7; color: #92400e; }
    .badge-dispatched     { background: #dcfce7; color: #166534; }
    .badge-delivered      { background: #f0fdf4; color: #14532d; }
    .badge-cancelled      { background: #fee2e2; color: #991b1b; }

    /* ── Detail expand panel ── */
    .detail-panel         { padding: 16px 20px; }
    .detail-title         { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: 0 0 10px; }
    .detail-table         { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 14px; }
    .detail-table th      { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; }
    .detail-table td      { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    .detail-table tr:last-child td { border-bottom: none; }
    .detail-actions       { display: flex; gap: 10px; }

    /* ── Misc ── */
    .empty-state          { text-align: center; padding: 48px 20px; color: #9ca3af; }
    .empty-icon           { font-size: 32px; margin-bottom: 10px; }
    .close-btn            { background: none; border: none; font-size: 18px; cursor: pointer; color: #6b7280; padding: 0 4px; line-height: 1; }
    .close-btn:hover      { color: #111; }

    @media (max-width: 900px) {
      .kpi-strip { grid-template-columns: repeat(2, 1fr); }
      .field-grid-3 { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .kpi-strip { grid-template-columns: 1fr; }
      .field-grid-3 { grid-template-columns: 1fr; }
      .lines-adder { grid-template-columns: 1fr; }
    }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Dispatch Orders</h1>
        <p class="page-sub">Create and manage outbound delivery requests</p>
      </div>
      <button class="btn-primary" (click)="toggleCreateForm()">
        {{ showForm() ? '✕ Close' : '+ New Order' }}
      </button>
    </div>

    <!-- Sub-nav -->
    <nav class="sub-nav">
      <a class="sub-nav-link" routerLink="/inventory"                routerLinkActive="sub-nav-active" [routerLinkActiveOptions]="{exact:true}">Stock Master</a>
      <a class="sub-nav-link" routerLink="/inventory/grn"            routerLinkActive="sub-nav-active">Receiving (GRN)</a>
      <a class="sub-nav-link" routerLink="/inventory/dispatch-orders" routerLinkActive="sub-nav-active">Dispatch Orders</a>
      <a class="sub-nav-link" routerLink="/inventory/transfer"       routerLinkActive="sub-nav-active">Transfer</a>
      <a class="sub-nav-link" routerLink="/inventory/adjustments"    routerLinkActive="sub-nav-active">Adjustments</a>
      <a class="sub-nav-link" routerLink="/inventory/alerts"         routerLinkActive="sub-nav-active">Alerts</a>
      <a class="sub-nav-link" routerLink="/inventory/reports"        routerLinkActive="sub-nav-active">Reports</a>
    </nav>

    <div class="content">

      <!-- KPI strip -->
      <div class="kpi-strip">
        <div class="kpi-card">
          <div class="kpi-icon">📦</div>
          <div>
            <p class="kpi-label">Total Orders</p>
            <p class="kpi-value">{{ kpiTotalOrders() }}</p>
            <p class="kpi-sub">all statuses</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🕐</div>
          <div>
            <p class="kpi-label">Pending Pick</p>
            <p class="kpi-value">{{ kpiPendingPick() }}</p>
            <p class="kpi-sub">draft + confirmed</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🚚</div>
          <div>
            <p class="kpi-label">Dispatched Today</p>
            <p class="kpi-value">{{ kpiDispatchedToday() }}</p>
            <p class="kpi-sub">{{ todayLabel() }}</p>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon">🔒</div>
          <div>
            <p class="kpi-label">Reserved Units</p>
            <p class="kpi-value">{{ kpiReservedUnits() }}</p>
            <p class="kpi-sub">across active orders</p>
          </div>
        </div>
      </div>

      <!-- Create Order Form Panel -->
      @if (showForm()) {
        <div class="form-panel">
          <div class="form-panel-header">
            <span class="form-panel-title">New Dispatch Order</span>
            <button class="close-btn" (click)="toggleCreateForm()">✕</button>
          </div>
          <div class="form-panel-body">

            <!-- Row 1: Customer Name, Customer ID, Warehouse -->
            <div class="field-grid-3">
              <div class="field-group">
                <label class="field-label">Customer Name <span style="color:#dc2626">*</span></label>
                <input class="field-input" type="text" [(ngModel)]="form.customerName" placeholder="e.g. Eko Supermarket Ltd" />
              </div>
              <div class="field-group">
                <label class="field-label">Customer ID <span style="color:#dc2626">*</span></label>
                <input class="field-input" type="text" [(ngModel)]="form.customerIdRaw" placeholder="e.g. 10021" />
                <span class="stock-hint">Will be prefixed: CUST-{{ form.customerIdRaw || '...' }}</span>
              </div>
              <div class="field-group">
                <label class="field-label">Warehouse</label>
                <select class="field-select" [(ngModel)]="form.warehouseId" (ngModelChange)="onWarehouseChange()">
                  <option value="">— Select warehouse —</option>
                  @for (wh of inventorySvc.warehouses; track wh.id) {
                    <option [value]="wh.id">{{ wh.name }}</option>
                  }
                </select>
              </div>
            </div>

            <!-- Row 2: Reference, Notes -->
            <div class="field-grid-2">
              <div class="field-group">
                <label class="field-label">Reference No. <span style="color:#9ca3af;font-weight:400;text-transform:none">(optional)</span></label>
                <input class="field-input" type="text" [(ngModel)]="form.reference" placeholder="auto-generated if blank" />
              </div>
              <div class="field-group">
                <label class="field-label">Notes <span style="color:#9ca3af;font-weight:400;text-transform:none">(optional)</span></label>
                <input class="field-input" type="text" [(ngModel)]="form.notes" placeholder="Any special instructions…" />
              </div>
            </div>

            <!-- Line items builder -->
            <div class="lines-section">
              <div class="lines-header">
                <span class="lines-header-title">Line Items ({{ form.lines.length }})</span>
              </div>

              <!-- Add line row -->
              <div class="lines-adder">
                <div class="field-group">
                  <label class="field-label">Item</label>
                  <select class="field-select" [(ngModel)]="lineForm.itemId" [disabled]="!form.warehouseId">
                    <option value="">— Select item —</option>
                    @for (item of availableItemsForWarehouse(); track item.id) {
                      <option [value]="item.id">{{ item.name }} ({{ item.sku }})</option>
                    }
                  </select>
                  @if (form.warehouseId && availableItemsForWarehouse().length === 0) {
                    <span class="stock-hint stock-warn">No stock in selected warehouse</span>
                  }
                  @if (!form.warehouseId) {
                    <span class="stock-hint">Select a warehouse first</span>
                  }
                </div>
                <div class="field-group">
                  <label class="field-label">Quantity</label>
                  <input class="field-input" type="number" min="1" [(ngModel)]="lineForm.qty" placeholder="Qty" />
                </div>
                <div class="field-group">
                  <label class="field-label">&nbsp;</label>
                  <button class="btn-secondary btn-sm" (click)="addLine()" [disabled]="!lineForm.itemId || lineForm.qty < 1">Add Line</button>
                </div>
              </div>

              <!-- Lines list -->
              @if (form.lines.length > 0) {
                <table class="lines-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th style="text-align:right">Ordered Qty</th>
                      <th style="text-align:right">Available</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (line of form.lines; track line.itemId; let i = $index) {
                      <tr>
                        <td>{{ line.itemName }}</td>
                        <td style="color:#6b7280">{{ line.sku }}</td>
                        <td style="text-align:right; font-weight:600">{{ line.orderedQty }}</td>
                        <td style="text-align:right">
                          <span [style.color]="getAvailableForItem(line.itemId) < line.orderedQty ? '#dc2626' : '#16a34a'">
                            {{ getAvailableForItem(line.itemId) }}
                          </span>
                        </td>
                        <td style="text-align:right">
                          <button class="btn-danger" style="font-size:11px;padding:3px 8px" (click)="removeLine(i)">Remove</button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <div class="lines-empty">No line items added yet. Select an item and quantity above.</div>
              }
            </div>

            <!-- Form action buttons -->
            <div class="form-btn-row">
              <button class="btn-primary" (click)="saveOrder('CONFIRMED')" [disabled]="!canSubmitForm()">
                Confirm Order
              </button>
              <button class="btn-secondary" (click)="saveOrder('DRAFT')" [disabled]="!canSubmitForm()">
                Save as Draft
              </button>
              <button class="btn-secondary" (click)="resetForm()">Reset</button>
            </div>

          </div>
        </div>
      }

      <!-- Orders Table -->
      <div class="table-card">
        <div class="table-toolbar">
          <span class="table-title">All Dispatch Orders</span>
          <span style="font-size:12px;color:#6b7280">{{ orders().length }} order{{ orders().length !== 1 ? 's' : '' }}</span>
        </div>

        @if (orders().length > 0) {
          <table class="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Warehouse</th>
                <th style="text-align:center">Lines</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of orders(); track order.id) {
                <!-- Data row -->
                <tr class="data-row" [class.expanded]="expandedOrderId() === order.id" (click)="toggleExpand(order.id)">
                  <td>
                    <div class="order-id">{{ order.id }}</div>
                    <div class="order-ref">{{ order.reference }}</div>
                  </td>
                  <td>
                    <div class="customer-name">{{ order.customerName }}</div>
                    <div class="customer-id">{{ order.customerId }}</div>
                  </td>
                  <td style="color:#374151">{{ order.warehouseName }}</td>
                  <td style="text-align:center">{{ order.lines.length }}</td>
                  <td><span class="badge" [ngClass]="statusBadgeClass(order.status)">{{ order.status }}</span></td>
                  <td style="color:#6b7280;white-space:nowrap">{{ order.createdAt | date:'dd MMM yyyy' }}</td>
                  <td (click)="$event.stopPropagation()">
                    <div style="display:flex;gap:6px;flex-wrap:wrap">
                      @if (canDispatch(order.status)) {
                        <button class="btn-primary btn-sm" (click)="markDispatched(order)">Dispatch</button>
                      }
                      @if (canCancel(order.status)) {
                        <button class="btn-danger" (click)="cancelOrder(order)">Cancel</button>
                      }
                    </div>
                  </td>
                </tr>

                <!-- Detail expand row -->
                @if (expandedOrderId() === order.id) {
                  <tr class="detail-row">
                    <td colspan="7">
                      <div class="detail-panel">
                        <p class="detail-title">Line Items — {{ order.id }}</p>
                        <table class="detail-table">
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th>SKU</th>
                              <th style="text-align:right">Ordered Qty</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            @for (line of order.lines; track line.itemId) {
                              <tr>
                                <td>{{ line.itemName }}</td>
                                <td style="color:#6b7280">{{ line.sku }}</td>
                                <td style="text-align:right; font-weight:600">{{ line.orderedQty }}</td>
                                <td><span class="badge" [ngClass]="statusBadgeClass(order.status)">{{ order.status }}</span></td>
                              </tr>
                            }
                          </tbody>
                        </table>
                        @if (order.notes) {
                          <div style="font-size:12px;color:#6b7280;margin-top:4px"><strong>Notes:</strong> {{ order.notes }}</div>
                        }
                        <div class="detail-actions" style="margin-top:14px">
                          @if (canDispatch(order.status)) {
                            <button class="btn-primary btn-sm" (click)="markDispatched(order)">Mark Dispatched</button>
                          }
                          @if (canCancel(order.status)) {
                            <button class="btn-danger" (click)="cancelOrder(order)">Cancel Order</button>
                          }
                        </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div>No dispatch orders yet. Click <strong>+ New Order</strong> to create one.</div>
          </div>
        }
      </div>

    </div>
  `,
})
export class DispatchOrdersPageComponent {
  readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  // ── Orders state ──────────────────────────────────────────────────────────
  readonly orders = signal<DispatchOrder[]>([...SEED_ORDERS]);

  // ── UI state ──────────────────────────────────────────────────────────────
  readonly showForm = signal(false);
  readonly expandedOrderId = signal<string | null>(null);

  // ── Create form state ─────────────────────────────────────────────────────
  form: {
    customerName: string;
    customerIdRaw: string;
    warehouseId: string;
    reference: string;
    notes: string;
    lines: DispatchOrderLine[];
  } = this.emptyForm();

  lineForm: { itemId: string; qty: number } = { itemId: '', qty: 1 };

  // ── KPI computeds ─────────────────────────────────────────────────────────

  readonly kpiTotalOrders = computed(() => this.orders().length);

  readonly kpiPendingPick = computed(() =>
    this.orders().filter(o => o.status === 'DRAFT' || o.status === 'CONFIRMED').length
  );

  readonly kpiDispatchedToday = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this.orders().filter(
      o => o.status === 'DISPATCHED' && o.createdAt.slice(0, 10) === today
    ).length;
  });

  readonly kpiReservedUnits = computed(() =>
    this.orders()
      .filter(o => !['CANCELLED', 'DELIVERED'].includes(o.status))
      .reduce((sum, o) => sum + o.lines.reduce((s, l) => s + l.orderedQty, 0), 0)
  );

  readonly todayLabel = computed(() => {
    const d = new Date();
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  });

  // ── Available items for selected warehouse ────────────────────────────────

  readonly availableItemsForWarehouse = computed(() => {
    const whId = this.form.warehouseId;
    if (!whId) return [];
    const stockedIds = new Set(
      this.inventorySvc.stockLevels()
        .filter(sl => sl.warehouseId === whId && sl.available > 0)
        .map(sl => sl.itemId)
    );
    return this.inventorySvc.items().filter(i => stockedIds.has(i.id));
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  private emptyForm() {
    return {
      customerName: '',
      customerIdRaw: '',
      warehouseId: '',
      reference: '',
      notes: '',
      lines: [] as DispatchOrderLine[],
    };
  }

  getAvailableForItem(itemId: string): number {
    const whId = this.form.warehouseId;
    if (!whId) return 0;
    return this.inventorySvc.stockLevels().find(
      sl => sl.itemId === itemId && sl.warehouseId === whId
    )?.available ?? 0;
  }

  statusBadgeClass(status: DispatchOrder['status']): string {
    switch (status) {
      case 'DRAFT':      return 'badge-draft';
      case 'CONFIRMED':  return 'badge-confirmed';
      case 'PICKING':    return 'badge-picking';
      case 'DISPATCHED': return 'badge-dispatched';
      case 'DELIVERED':  return 'badge-delivered';
      case 'CANCELLED':  return 'badge-cancelled';
    }
  }

  canDispatch(status: DispatchOrder['status']): boolean {
    return status === 'CONFIRMED' || status === 'PICKING';
  }

  canCancel(status: DispatchOrder['status']): boolean {
    return status === 'DRAFT' || status === 'CONFIRMED' || status === 'PICKING';
  }

  canSubmitForm(): boolean {
    return (
      !!this.form.customerName.trim() &&
      !!this.form.customerIdRaw.trim() &&
      !!this.form.warehouseId &&
      this.form.lines.length > 0
    );
  }

  // ── UI actions ────────────────────────────────────────────────────────────

  toggleCreateForm(): void {
    this.showForm.update(v => !v);
    if (!this.showForm()) this.resetForm();
  }

  toggleExpand(orderId: string): void {
    this.expandedOrderId.update(id => id === orderId ? null : orderId);
  }

  onWarehouseChange(): void {
    this.form.lines = [];
    this.lineForm = { itemId: '', qty: 1 };
  }

  addLine(): void {
    if (!this.lineForm.itemId || this.lineForm.qty < 1) return;

    // Prevent duplicate item in lines
    if (this.form.lines.some(l => l.itemId === this.lineForm.itemId)) {
      this.toastSvc.error('This item is already in the order. Remove it first to change quantity.');
      return;
    }

    const item = this.inventorySvc.items().find(i => i.id === this.lineForm.itemId);
    if (!item) return;

    const available = this.getAvailableForItem(item.id);
    if (this.lineForm.qty > available) {
      this.toastSvc.error(`Only ${available} units available for "${item.name}" in this warehouse.`);
      return;
    }

    this.form.lines = [
      ...this.form.lines,
      {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        orderedQty: this.lineForm.qty,
      },
    ];
    this.lineForm = { itemId: '', qty: 1 };
  }

  removeLine(index: number): void {
    this.form.lines = this.form.lines.filter((_, i) => i !== index);
  }

  saveOrder(status: 'DRAFT' | 'CONFIRMED'): void {
    if (!this.canSubmitForm()) return;

    const warehouse = this.inventorySvc.warehouses.find(w => w.id === this.form.warehouseId);
    const ref = this.form.reference.trim() || ('DO-' + Date.now());
    const orderId = 'DO-' + String(this.orders().length + 1).padStart(3, '0') + '-' + Date.now().toString().slice(-4);

    const newOrder: DispatchOrder = {
      id: orderId,
      customerId: 'CUST-' + this.form.customerIdRaw.trim(),
      customerName: this.form.customerName.trim(),
      warehouseId: this.form.warehouseId,
      warehouseName: warehouse?.name ?? this.form.warehouseId,
      lines: [...this.form.lines],
      status,
      reference: ref,
      notes: this.form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    // If CONFIRMED, post movements immediately
    if (status === 'CONFIRMED') {
      const now = new Date().toISOString();
      newOrder.lines.forEach((line, idx) => {
        const movement: StockMovement = {
          id: 'MOV-DO-' + Date.now() + '-' + idx,
          itemId: line.itemId,
          warehouseId: newOrder.warehouseId,
          type: 'DISPATCH',
          quantity: line.orderedQty,
          reference: ref,
          reason: `Dispatch order ${orderId} — ${newOrder.customerName}`,
          performedBy: 'Dispatch System',
          createdAt: now,
          notes: newOrder.notes,
          shipmentLoadId: orderId,
        };
        this.inventorySvc.addMovement(movement);
      });
      this.toastSvc.success(`Order ${orderId} confirmed — ${newOrder.lines.length} movement(s) posted.`);
    } else {
      this.toastSvc.success(`Order ${orderId} saved as draft.`);
    }

    this.orders.update(list => [newOrder, ...list]);
    this.showForm.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.form = this.emptyForm();
    this.lineForm = { itemId: '', qty: 1 };
  }

  // ── Order actions ─────────────────────────────────────────────────────────

  markDispatched(order: DispatchOrder): void {
    const now = new Date().toISOString();
    let movCount = 0;

    order.lines.forEach((line, idx) => {
      const movement: StockMovement = {
        id: 'MOV-DISP-' + Date.now() + '-' + idx,
        itemId: line.itemId,
        warehouseId: order.warehouseId,
        type: 'DISPATCH',
        quantity: line.orderedQty,
        reference: order.reference,
        reason: `Dispatch order ${order.id} — ${order.customerName}`,
        performedBy: 'Dispatch System',
        createdAt: now,
        notes: order.notes,
        shipmentLoadId: order.id,
      };
      this.inventorySvc.addMovement(movement);
      movCount++;
    });

    this.orders.update(list =>
      list.map(o => o.id === order.id ? { ...o, status: 'DISPATCHED' } : o)
    );

    this.toastSvc.success(`Order ${order.id} dispatched — ${movCount} movement(s) posted.`);
  }

  cancelOrder(order: DispatchOrder): void {
    this.orders.update(list =>
      list.map(o => o.id === order.id ? { ...o, status: 'CANCELLED' } : o)
    );
    this.toastSvc.success(`Order ${order.id} cancelled.`);
  }
}
