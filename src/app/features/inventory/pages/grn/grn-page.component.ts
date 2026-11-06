import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../inventory.service';
import { ToastService } from '../../../../core/services/toast.service';
import { StockMovement } from '../../inventory.model';

// ─── Mock PO Types ────────────────────────────────────────────────────────────
interface POLine {
  itemId: string;
  itemName: string;
  sku: string;
  expectedQty: number;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  expectedDate: string;
  warehouseId: string;
  lines: POLine[];
}

// ─── GRN Form Line ───────────────────────────────────────────────────────────
interface GrnLine extends POLine {
  receivedQty: number;
  damagedQty: number;
  condition: 'OK' | 'Damaged';
}

// ─── Mock Purchase Orders ────────────────────────────────────────────────────
const MOCK_POS: PurchaseOrder[] = [
  {
    id: 'PO-2026-1001',
    supplierName: 'Olam Agri Nigeria',
    expectedDate: '2026-11-08',
    warehouseId: 'WH-001',
    lines: [
      { itemId: 'ITEM-001', itemName: 'Rice (50kg Bag)',       sku: 'FBV-RCE-50K', expectedQty: 150 },
      { itemId: 'ITEM-006', itemName: 'Coca-Cola 50cl (Carton)', sku: 'FBV-BEV-CRT', expectedQty: 80 },
    ],
  },
  {
    id: 'PO-2026-1002',
    supplierName: 'Dangote Industries',
    expectedDate: '2026-11-10',
    warehouseId: 'WH-001',
    lines: [
      { itemId: 'ITEM-002', itemName: 'Dangote Cement (50kg)',  sku: 'BLD-CEM-50K', expectedQty: 300 },
      { itemId: 'ITEM-008', itemName: 'Engine Oil (20L Drum)',  sku: 'CHM-LUB-20L', expectedQty: 20 },
    ],
  },
  {
    id: 'PO-2026-1003',
    supplierName: 'Notore Chemicals & Fidson',
    expectedDate: '2026-11-12',
    warehouseId: 'WH-002',
    lines: [
      { itemId: 'ITEM-007', itemName: 'NPK Fertiliser (50kg)',      sku: 'AGR-FRT-50K', expectedQty: 200 },
      { itemId: 'ITEM-003', itemName: 'Amoxicillin 500mg (Carton)', sku: 'PHR-AML-500', expectedQty: 25 },
      { itemId: 'ITEM-005', itemName: 'Truck Tyre 225/75R17.5',     sku: 'AUT-TYR-225', expectedQty: 30 },
    ],
  },
];

@Component({
  selector: 'app-grn-page',
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

    .layout      { display: flex; gap: 20px; padding: 0 28px 32px; }

    /* Left PO list panel */
    .po-panel    { width: 280px; flex-shrink: 0; }
    .panel-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; margin: 0 0 10px; }

    .po-card     { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; cursor: pointer; margin-bottom: 8px; transition: border-color .15s, background .15s; }
    .po-card:hover { border-color: #111; background: #f9fafb; }
    .po-card.selected { border-color: #111; background: #f3f4f6; }
    .po-card-id  { font-size: 11px; color: #9ca3af; margin-bottom: 2px; }
    .po-card-sup { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .po-card-meta{ font-size: 12px; color: #6b7280; }

    /* Right form panel */
    .form-panel  { flex: 1; min-width: 0; }

    .form-card   { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .form-card-header { padding: 14px 18px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .form-card-title  { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
    .form-card-sub    { font-size: 12px; color: #6b7280; margin: 0; }
    .form-card-body   { padding: 18px; }

    /* GRN grid table */
    .grn-table   { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px; }
    .grn-table th{ text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; color: #6b7280; padding: 0 8px 8px; border-bottom: 1px solid #e5e7eb; }
    .grn-table td{ padding: 8px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }

    .qty-input   { width: 72px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 5px 8px; font-family: 'Times New Roman', serif; font-size: 13px; }
    .qty-input:focus { outline: none; border-color: #111; }

    .badge       { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
    .badge-ok    { background: #d1fae5; color: #065f46; }
    .badge-dmg   { background: #fee2e2; color: #991b1b; }

    /* Meta fields row */
    .meta-row    { display: flex; gap: 14px; margin-bottom: 14px; flex-wrap: wrap; }
    .meta-group  { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; }
    .meta-label  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; color: #6b7280; }
    .meta-input  { border: 1px solid #e5e7eb; border-radius: 6px; padding: 7px 10px; font-family: 'Times New Roman', serif; font-size: 13px; }
    .meta-input:focus { outline: none; border-color: #111; }

    .btn-row     { display: flex; gap: 10px; margin-top: 6px; }

    .btn-primary { background: #111; color: #fff; border: none; padding: 9px 20px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #333; }
    .btn-secondary { background: #fff; color: #111; border: 1px solid #d1d5db; padding: 9px 20px; border-radius: 6px; font-family: 'Times New Roman', serif; font-size: 13px; cursor: pointer; }
    .btn-secondary:hover { background: #f9fafb; }

    /* Recent GRNs table */
    .section-title { font-size: 14px; font-weight: 700; margin: 28px 0 10px; }
    .receipts-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .receipts-table th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing:.05em; color: #6b7280; padding: 0 10px 8px; border-bottom: 1px solid #e5e7eb; }
    .receipts-table td { padding: 9px 10px; border-bottom: 1px solid #f3f4f6; color: #374151; }

    .empty-state { text-align: center; padding: 40px 20px; color: #9ca3af; font-size: 14px; }
    .empty-icon  { font-size: 32px; margin-bottom: 10px; }
  `],
  template: `
    <div class="page-header">
      <h1 class="page-title">Goods Receiving</h1>
      <p class="page-sub">Record inbound stock against purchase orders</p>
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

    <div class="layout">
      <!-- Left: PO List -->
      <div class="po-panel">
        <p class="panel-title">Pending Purchase Orders</p>
        @for (po of mockPos; track po.id) {
          <div
            class="po-card"
            [class.selected]="selectedPo()?.id === po.id"
            (click)="selectPo(po)"
          >
            <div class="po-card-id">{{ po.id }}</div>
            <div class="po-card-sup">{{ po.supplierName }}</div>
            <div class="po-card-meta">Expected: {{ po.expectedDate }}</div>
            <div class="po-card-meta">{{ po.lines.length }} item{{ po.lines.length !== 1 ? 's' : '' }} · {{ po.warehouseId }}</div>
          </div>
        }
      </div>

      <!-- Right: GRN Form -->
      <div class="form-panel">
        @if (selectedPo()) {
          <div class="form-card">
            <div class="form-card-header">
              <div class="form-card-title">{{ selectedPo()!.id }} — {{ selectedPo()!.supplierName }}</div>
              <div class="form-card-sub">Warehouse: {{ selectedPo()!.warehouseId }} · Expected: {{ selectedPo()!.expectedDate }}</div>
            </div>
            <div class="form-card-body">

              <!-- Line items grid -->
              <table class="grn-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th style="text-align:right">Expected</th>
                    <th style="text-align:right">Received</th>
                    <th style="text-align:right">Damaged</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (line of grnLines(); track line.itemId; let i = $index) {
                    <tr>
                      <td>{{ line.itemName }}</td>
                      <td style="color:#6b7280">{{ line.sku }}</td>
                      <td style="text-align:right">{{ line.expectedQty }}</td>
                      <td style="text-align:right">
                        <input
                          class="qty-input"
                          type="number"
                          min="0"
                          [ngModel]="line.receivedQty"
                          (ngModelChange)="updateLine(i, 'receivedQty', $event)"
                        />
                      </td>
                      <td style="text-align:right">
                        <input
                          class="qty-input"
                          type="number"
                          min="0"
                          [ngModel]="line.damagedQty"
                          (ngModelChange)="updateLine(i, 'damagedQty', $event)"
                        />
                      </td>
                      <td>
                        @if (line.damagedQty > 0) {
                          <span class="badge badge-dmg">Damaged</span>
                        } @else {
                          <span class="badge badge-ok">OK</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>

              <!-- Meta fields -->
              <div class="meta-row">
                <div class="meta-group">
                  <label class="meta-label">Receiver Name</label>
                  <input class="meta-input" type="text" [(ngModel)]="receiverName" placeholder="e.g. Emeka Okafor" />
                </div>
                <div class="meta-group">
                  <label class="meta-label">Reference / GRN No.</label>
                  <input class="meta-input" type="text" [(ngModel)]="grnRef" placeholder="auto-generated if blank" />
                </div>
                <div class="meta-group" style="flex:2">
                  <label class="meta-label">Notes</label>
                  <input class="meta-input" type="text" [(ngModel)]="grnNotes" placeholder="Optional notes…" />
                </div>
              </div>

              <div class="btn-row">
                <button class="btn-primary" (click)="postGrn()">Post GRN</button>
                <button class="btn-secondary" (click)="cancel()">Cancel</button>
              </div>
            </div>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <div>Select a Purchase Order from the list to begin receiving.</div>
          </div>
        }

        <!-- Recent GRNs -->
        <div class="section-title">Recent Receipts (Last 10)</div>
        @if (recentReceipts().length > 0) {
          <table class="receipts-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Item ID</th>
                <th>Reference</th>
                <th style="text-align:right">Qty</th>
                <th>Performed By</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (m of recentReceipts(); track m.id) {
                <tr>
                  <td>{{ m.createdAt | date:'dd MMM yyyy, HH:mm' }}</td>
                  <td>{{ m.itemId }}</td>
                  <td>{{ m.reference }}</td>
                  <td style="text-align:right">{{ m.quantity }}</td>
                  <td>{{ m.performedBy }}</td>
                  <td style="color:#6b7280">{{ m.notes || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <div style="color:#9ca3af; font-size:13px; padding: 12px 0;">No receipt movements recorded yet.</div>
        }
      </div>
    </div>
  `,
})
export class GrnPageComponent {
  private readonly inventorySvc = inject(InventoryService);
  private readonly toastSvc = inject(ToastService);

  readonly mockPos = MOCK_POS;

  selectedPo = signal<PurchaseOrder | null>(null);
  grnLines   = signal<GrnLine[]>([]);

  receiverName = '';
  grnRef       = '';
  grnNotes     = '';

  readonly recentReceipts = computed(() =>
    this.inventorySvc.movements()
      .filter(m => m.type === 'RECEIPT')
      .slice(-10)
      .reverse()
  );

  selectPo(po: PurchaseOrder): void {
    this.selectedPo.set(po);
    this.grnLines.set(
      po.lines.map(l => ({ ...l, receivedQty: l.expectedQty, damagedQty: 0, condition: 'OK' }))
    );
    this.receiverName = '';
    this.grnRef       = '';
    this.grnNotes     = '';
  }

  updateLine(index: number, field: 'receivedQty' | 'damagedQty', value: number): void {
    this.grnLines.update(lines => {
      const updated = [...lines];
      updated[index] = { ...updated[index], [field]: Number(value) };
      return updated;
    });
  }

  postGrn(): void {
    const po = this.selectedPo();
    if (!po) return;
    if (!this.receiverName.trim()) {
      this.toastSvc.error('Please enter a receiver name.');
      return;
    }

    const ref       = this.grnRef.trim() || ('GRN-' + Date.now());
    const now       = new Date().toISOString();
    const performer = this.receiverName.trim();

    this.grnLines().forEach((line, idx) => {
      const okQty      = Math.max(0, line.receivedQty - line.damagedQty);
      const damagedQty = Math.max(0, line.damagedQty);

      if (okQty > 0) {
        const receipt: StockMovement = {
          id:          'MOV-' + Date.now() + '-' + idx + 'R',
          itemId:      line.itemId,
          warehouseId: po.warehouseId,
          type:        'RECEIPT',
          quantity:    okQty,
          reference:   ref,
          reason:      `GRN receipt against ${po.id}`,
          performedBy: performer,
          createdAt:   now,
          notes:       this.grnNotes,
        };
        this.inventorySvc.addMovement(receipt);
      }

      if (damagedQty > 0) {
        const adjustment: StockMovement = {
          id:              'MOV-' + Date.now() + '-' + idx + 'D',
          itemId:          line.itemId,
          warehouseId:     po.warehouseId,
          type:            'ADJUSTMENT',
          quantity:        -damagedQty,
          reference:       ref + '-DMG',
          reason:          `Damaged goods on receipt from ${po.supplierName}`,
          performedBy:     performer,
          createdAt:       now,
          notes:           this.grnNotes,
          adjustmentReason:'DAMAGE',
        };
        this.inventorySvc.addMovement(adjustment);
      }
    });

    this.toastSvc.success(`GRN ${ref} posted successfully for ${po.id}.`);
    this.selectedPo.set(null);
    this.grnLines.set([]);
  }

  cancel(): void {
    this.selectedPo.set(null);
    this.grnLines.set([]);
  }
}
