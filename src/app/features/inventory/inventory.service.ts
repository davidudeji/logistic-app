import { Injectable, computed, signal } from '@angular/core';
import {
  InventoryItem,
  InventoryDashboardKpi,
  LowStockAlert,
  StockLevel,
  StockMovement,
  WarehouseBasic,
  DispatchOrder,
  DispatchOrderLine,
  DispatchOrderStatus,
  ProofOfDelivery,
  ReturnRecord,
} from './inventory.model';

// ─── Mock Warehouses ──────────────────────────────────────────────────────────
const MOCK_WAREHOUSES: WarehouseBasic[] = [
  { id: 'WH-001', name: 'Lagos Central Depot', city: 'Lagos', state: 'Lagos' },
  { id: 'WH-002', name: 'Kano Northern Hub', city: 'Kano', state: 'Kano' },
  { id: 'WH-003', name: 'Abuja FCT Store', city: 'Abuja', state: 'FCT' },
];

// ─── Mock Items ───────────────────────────────────────────────────────────────
const MOCK_ITEMS: InventoryItem[] = [
  {
    id: 'ITEM-001',
    sku: 'FBV-RCE-50K',
    name: 'Rice (50kg Bag)',
    category: 'FOOD_AND_BEVERAGE',
    weightKg: 50,
    unitOfMeasure: 'BAG',
    photos: [],
    description: 'Premium long-grain parboiled rice, 50kg polypropylene bag',
    reorderPoint: 100,
    safetyStock: 50,
    unitCostNaira: 42000,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-10-01T12:00:00Z',
  },
  {
    id: 'ITEM-002',
    sku: 'BLD-CEM-50K',
    name: 'Dangote Cement (50kg)',
    category: 'BUILDING_MATERIALS',
    weightKg: 50,
    unitOfMeasure: 'BAG',
    photos: [],
    description: 'Portland cement for general construction, 50kg bag',
    reorderPoint: 200,
    safetyStock: 80,
    unitCostNaira: 8500,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-10-05T09:00:00Z',
  },
  {
    id: 'ITEM-003',
    sku: 'PHR-AML-500',
    name: 'Amoxicillin 500mg (Carton)',
    category: 'PHARMACEUTICALS',
    weightKg: 4,
    unitOfMeasure: 'CARTON',
    photos: [],
    description: 'Amoxicillin antibiotic 500mg caps, 100 blister packs per carton',
    reorderPoint: 20,
    safetyStock: 10,
    unitCostNaira: 125000,
    createdAt: '2025-02-14T10:00:00Z',
    updatedAt: '2025-10-10T11:00:00Z',
  },
  {
    id: 'ITEM-004',
    sku: 'ELC-GEN-10KV',
    name: 'Generator 10KVA (Sumec)',
    category: 'ELECTRONICS',
    weightKg: 180,
    unitOfMeasure: 'PIECE',
    photos: [],
    description: 'Sumec Firman 10KVA diesel generator with AVR',
    reorderPoint: 5,
    safetyStock: 2,
    unitCostNaira: 950000,
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: '2025-09-20T14:00:00Z',
  },
  {
    id: 'ITEM-005',
    sku: 'AUT-TYR-225',
    name: 'Truck Tyre 225/75R17.5',
    category: 'AUTOMOTIVE_PARTS',
    weightKg: 32,
    unitOfMeasure: 'PIECE',
    photos: [],
    description: 'Heavy-duty radial truck tyre, all-season, Bridgestone',
    reorderPoint: 20,
    safetyStock: 8,
    unitCostNaira: 65000,
    createdAt: '2025-02-20T08:00:00Z',
    updatedAt: '2025-10-02T16:00:00Z',
  },
  {
    id: 'ITEM-006',
    sku: 'FBV-BEV-CRT',
    name: 'Coca-Cola 50cl (Carton)',
    category: 'FOOD_AND_BEVERAGE',
    weightKg: 12,
    unitOfMeasure: 'CARTON',
    photos: [],
    description: '24 bottles of 50cl Coca-Cola per carton',
    reorderPoint: 150,
    safetyStock: 60,
    unitCostNaira: 2800,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-10-08T10:00:00Z',
  },
  {
    id: 'ITEM-007',
    sku: 'AGR-FRT-50K',
    name: 'NPK Fertiliser (50kg)',
    category: 'AGRICULTURAL',
    weightKg: 50,
    unitOfMeasure: 'BAG',
    photos: [],
    description: 'NPK 15-15-15 compound fertiliser, 50kg polywoven bag',
    reorderPoint: 300,
    safetyStock: 100,
    unitCostNaira: 32000,
    createdAt: '2025-04-01T07:00:00Z',
    updatedAt: '2025-10-01T08:00:00Z',
  },
  {
    id: 'ITEM-008',
    sku: 'CHM-LUB-20L',
    name: 'Engine Oil (20L Drum)',
    category: 'CHEMICALS',
    weightKg: 18,
    unitOfMeasure: 'DRUM',
    photos: [],
    description: 'Mobil Delvac 15W-40 heavy-duty diesel engine oil, 20L',
    reorderPoint: 30,
    safetyStock: 10,
    unitCostNaira: 54000,
    createdAt: '2025-03-10T09:00:00Z',
    updatedAt: '2025-10-04T13:00:00Z',
  },
];

// ─── Mock Stock Levels ────────────────────────────────────────────────────────
const MOCK_STOCK_LEVELS: StockLevel[] = [
  { itemId: 'ITEM-001', warehouseId: 'WH-001', onHand: 320, reserved: 60, available: 260, inTransit: 80, damaged: 5, lastUpdated: '2025-10-14T06:00:00Z' },
  { itemId: 'ITEM-002', warehouseId: 'WH-001', onHand: 180, reserved: 40, available: 140, inTransit: 120, damaged: 0, lastUpdated: '2025-10-14T06:00:00Z' },
  { itemId: 'ITEM-003', warehouseId: 'WH-002', onHand: 14,  reserved: 4,  available: 10,  inTransit: 6,   damaged: 0, lastUpdated: '2025-10-13T10:00:00Z' },
  { itemId: 'ITEM-004', warehouseId: 'WH-001', onHand: 4,   reserved: 1,  available: 3,   inTransit: 2,   damaged: 0, lastUpdated: '2025-10-12T14:00:00Z' },
  { itemId: 'ITEM-005', warehouseId: 'WH-001', onHand: 12,  reserved: 4,  available: 8,   inTransit: 10,  damaged: 1, lastUpdated: '2025-10-14T07:00:00Z' },
  { itemId: 'ITEM-006', warehouseId: 'WH-003', onHand: 90,  reserved: 20, available: 70,  inTransit: 40,  damaged: 0, lastUpdated: '2025-10-14T06:30:00Z' },
  { itemId: 'ITEM-007', warehouseId: 'WH-002', onHand: 240, reserved: 80, available: 160, inTransit: 50,  damaged: 10, lastUpdated: '2025-10-14T05:00:00Z' },
  { itemId: 'ITEM-008', warehouseId: 'WH-001', onHand: 22,  reserved: 5,  available: 17,  inTransit: 8,   damaged: 0, lastUpdated: '2025-10-13T16:00:00Z' },
];

// ─── Mock Movements ───────────────────────────────────────────────────────────
const MOCK_MOVEMENTS: StockMovement[] = [
  { id: 'MOV-001', itemId: 'ITEM-001', warehouseId: 'WH-001', type: 'RECEIPT',    quantity: 200, reference: 'PO-2025-0101', reason: 'Scheduled purchase order receipt',    performedBy: 'Emeka Okafor',    createdAt: '2025-10-01T08:00:00Z', notes: 'Supplier: Olam Agri' },
  { id: 'MOV-002', itemId: 'ITEM-001', warehouseId: 'WH-001', type: 'DISPATCH',   quantity: 60,  reference: 'ORD-2025-5541', reason: 'Customer order fulfilment',           performedBy: 'Funmi Adeyemi',   createdAt: '2025-10-03T10:30:00Z', notes: 'Delivery to Kano client' },
  { id: 'MOV-003', itemId: 'ITEM-002', warehouseId: 'WH-001', type: 'RECEIPT',    quantity: 300, reference: 'PO-2025-0102', reason: 'Cement restocking',                   performedBy: 'Emeka Okafor',    createdAt: '2025-10-02T09:00:00Z', notes: 'From Dangote factory Lagos' },
  { id: 'MOV-004', itemId: 'ITEM-002', warehouseId: 'WH-001', type: 'DISPATCH',   quantity: 120, reference: 'ORD-2025-5560', reason: 'Construction site delivery',          performedBy: 'Yemi Balogun',    createdAt: '2025-10-05T11:00:00Z', notes: 'Site: Lekki Phase 2' },
  { id: 'MOV-005', itemId: 'ITEM-003', warehouseId: 'WH-002', type: 'RECEIPT',    quantity: 30,  reference: 'PO-2025-0208', reason: 'Pharma restock from distributor',     performedBy: 'Hauwa Musa',      createdAt: '2025-10-05T07:30:00Z', notes: 'Supplier: Fidson Healthcare' },
  { id: 'MOV-006', itemId: 'ITEM-003', warehouseId: 'WH-002', type: 'DISPATCH',   quantity: 16,  reference: 'ORD-2025-5590', reason: 'Hospital supply order',               performedBy: 'Hauwa Musa',      createdAt: '2025-10-10T09:00:00Z', notes: 'AKTH Hospital Kano' },
  { id: 'MOV-007', itemId: 'ITEM-004', warehouseId: 'WH-001', type: 'RECEIPT',    quantity: 6,   reference: 'PO-2025-0303', reason: 'Generator stock top-up',              performedBy: 'Chidi Nwosu',     createdAt: '2025-09-28T14:00:00Z', notes: 'From Sumec distributor Apapa' },
  { id: 'MOV-008', itemId: 'ITEM-004', warehouseId: 'WH-001', type: 'DISPATCH',   quantity: 2,   reference: 'ORD-2025-5610', reason: 'Client purchase - site power backup', performedBy: 'Funmi Adeyemi',   createdAt: '2025-10-08T13:00:00Z', notes: '' },
  { id: 'MOV-009', itemId: 'ITEM-005', warehouseId: 'WH-001', type: 'RECEIPT',    quantity: 40,  reference: 'PO-2025-0401', reason: 'Fleet maintenance tyre stock',        performedBy: 'Emeka Okafor',    createdAt: '2025-10-02T08:00:00Z', notes: 'Bridgestone Nigeria' },
  { id: 'MOV-010', itemId: 'ITEM-005', warehouseId: 'WH-001', type: 'ADJUSTMENT', quantity: -1,  reference: 'ADJ-2025-021',  reason: 'Damaged in transit – write-off',     performedBy: 'Yemi Balogun',    createdAt: '2025-10-10T16:00:00Z', notes: 'Burst tyre during Lagos delivery' },
  { id: 'MOV-011', itemId: 'ITEM-006', warehouseId: 'WH-003', type: 'RECEIPT',    quantity: 200, reference: 'PO-2025-0501', reason: 'Beverage restocking Abuja hub',       performedBy: 'Ngozi Eze',       createdAt: '2025-10-04T10:00:00Z', notes: 'From NBC depot Kubwa' },
  { id: 'MOV-012', itemId: 'ITEM-006', warehouseId: 'WH-003', type: 'DISPATCH',   quantity: 110, reference: 'ORD-2025-5620', reason: 'Supermarket chain order',             performedBy: 'Ngozi Eze',       createdAt: '2025-10-09T11:30:00Z', notes: 'Shoprite Abuja Mall' },
  { id: 'MOV-013', itemId: 'ITEM-007', warehouseId: 'WH-002', type: 'RECEIPT',    quantity: 500, reference: 'PO-2025-0601', reason: 'Pre-season fertiliser stock',         performedBy: 'Hauwa Musa',      createdAt: '2025-09-25T07:00:00Z', notes: 'Notore Chemicals supply' },
  { id: 'MOV-014', itemId: 'ITEM-007', warehouseId: 'WH-002', type: 'DISPATCH',   quantity: 260, reference: 'ORD-2025-5580', reason: 'Cooperative society order',           performedBy: 'Aliyu Dantata',   createdAt: '2025-10-03T08:00:00Z', notes: 'Kano farmers coop' },
  { id: 'MOV-015', itemId: 'ITEM-008', warehouseId: 'WH-001', type: 'RECEIPT',    quantity: 40,  reference: 'PO-2025-0701', reason: 'Fleet consumables top-up',            performedBy: 'Chidi Nwosu',     createdAt: '2025-10-06T09:00:00Z', notes: 'Mobil distributor Lagos' },
];

@Injectable({ providedIn: 'root' })
export class InventoryService {
  // ── Private writable signals ─────────────────────────────────────────────
  private readonly _items = signal<InventoryItem[]>([...MOCK_ITEMS]);
  private readonly _stockLevels = signal<StockLevel[]>([...MOCK_STOCK_LEVELS]);
  private readonly _movements = signal<StockMovement[]>([...MOCK_MOVEMENTS]);
  private readonly _dispatchOrders = signal<DispatchOrder[]>([]);
  private readonly _proofOfDeliveries = signal<ProofOfDelivery[]>([]);
  private readonly _returnRecords = signal<ReturnRecord[]>([]);

  // ── Public read-only signals ──────────────────────────────────────────────
  readonly items = this._items.asReadonly();
  readonly stockLevels = this._stockLevels.asReadonly();
  readonly movements = this._movements.asReadonly();
  readonly warehouses: WarehouseBasic[] = MOCK_WAREHOUSES;
  readonly dispatchOrders = this._dispatchOrders.asReadonly();
  readonly proofOfDeliveries = this._proofOfDeliveries.asReadonly();
  readonly returnRecords = this._returnRecords.asReadonly();

  // ── Computed ──────────────────────────────────────────────────────────────

  /** Items where available stock is at or below the reorder point */
  readonly getLowStockAlerts = computed<LowStockAlert[]>(() => {
    return this._items().reduce<LowStockAlert[]>((acc, item) => {
      const level = this._stockLevels().find(s => s.itemId === item.id);
      const available = level?.available ?? 0;
      if (available <= item.reorderPoint) {
        acc.push({ item, currentStock: available, reorderPoint: item.reorderPoint });
      }
      return acc;
    }, []);
  });

  /** Count of unique warehouses that have at least one low-stock item */
  readonly lowStockTotal = computed<number>(() => this.getLowStockAlerts().length);

  /** Items filtered by warehouse */
  getItemsByWarehouse(warehouseId: string): string[] {
    return this._stockLevels()
      .filter(l => l.warehouseId === warehouseId)
      .map(l => l.itemId);
  }

  /** Aggregated KPI values for the dashboard widget */
  readonly getDashboardKpi = computed<InventoryDashboardKpi>(() => {
    const items = this._items();
    const levels = this._stockLevels();
    const movements = this._movements();

    const totalValueNaira = items.reduce((sum, item) => {
      const level = levels.find(s => s.itemId === item.id);
      return sum + (level?.onHand ?? 0) * item.unitCostNaira;
    }, 0);

    const lowStockCount = items.filter(item => {
      const level = levels.find(s => s.itemId === item.id);
      return (level?.available ?? 0) <= item.reorderPoint;
    }).length;

    const inTransitCount = levels.reduce((sum, l) => sum + l.inTransit, 0);

    const pendingReceipts = movements.filter(m => m.type === 'RECEIPT').length;

    return {
      totalItems: items.length,
      totalValueNaira,
      lowStockCount,
      pendingReceipts,
      inTransitCount,
    };
  });

  // ── Methods ───────────────────────────────────────────────────────────────

  getItemStockLevel(itemId: string): StockLevel | null {
    return this._stockLevels().find(s => s.itemId === itemId) ?? null;
  }

  getMovementsForItem(itemId: string): StockMovement[] {
    return this._movements().filter(m => m.itemId === itemId);
  }

  addItem(item: InventoryItem): void {
    this._items.update(list => [...list, item]);
    // Seed an empty stock level for the new item
    const level: StockLevel = {
      itemId: item.id,
      warehouseId: 'WH-001',
      onHand: 0,
      reserved: 0,
      available: 0,
      inTransit: 0,
      damaged: 0,
      lastUpdated: new Date().toISOString(),
    };
    this._stockLevels.update(list => [...list, level]);
  }

  /** Link a dispatched movement to a load/shipment ID */
  linkMovementToShipment(movementId: string, loadId: string): void {
    this._movements.update(mvs =>
      mvs.map(m => m.id === movementId ? { ...m, shipmentLoadId: loadId } : m)
    );
  }

  /** Get all movements for a given load */
  getMovementsForLoad(loadId: string): StockMovement[] {
    return this._movements().filter(m => (m as any)['shipmentLoadId'] === loadId);
  }

  // ── Dispatch Orders ───────────────────────────────────────────────────────

  addDispatchOrder(order: DispatchOrder): void {
    this._dispatchOrders.update(list => [...list, order]);
  }

  updateDispatchOrderStatus(orderId: string, status: DispatchOrderStatus): void {
    this._dispatchOrders.update(list =>
      list.map(o => o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o)
    );
  }

  linkDispatchOrderToLoad(orderId: string, loadId: string): void {
    this._dispatchOrders.update(list =>
      list.map(o => o.id === orderId ? { ...o, linkedLoadId: loadId, updatedAt: new Date().toISOString() } : o)
    );
  }

  // ── Proof of Delivery ─────────────────────────────────────────────────────

  addProofOfDelivery(pod: ProofOfDelivery): void {
    this._proofOfDeliveries.update(list => [...list, pod]);
    // Also mark the linked dispatch order as DELIVERED
    this._dispatchOrders.update(list =>
      list.map(o =>
        o.id === pod.dispatchOrderId
          ? { ...o, status: 'DELIVERED' as DispatchOrderStatus, updatedAt: new Date().toISOString() }
          : o
      )
    );
  }

  getPodForOrder(orderId: string): ProofOfDelivery | undefined {
    return this._proofOfDeliveries().find(p => p.dispatchOrderId === orderId);
  }

  // ── Returns / RMA ─────────────────────────────────────────────────────────

  addReturnRecord(record: ReturnRecord): void {
    this._returnRecords.update(list => [...list, record]);
  }

  /**
   * Appends an immutable movement record to the ledger and mutates the
   * corresponding stock level in-place (additive for receipts/returns,
   * subtractive for dispatches, direct delta for adjustments).
   */
  addMovement(movement: StockMovement): void {
    this._movements.update(list => [...list, movement]);

    this._stockLevels.update(levels =>
      levels.map(level => {
        if (level.itemId !== movement.itemId || level.warehouseId !== movement.warehouseId) {
          return level;
        }
        let { onHand, available, inTransit } = level;
        const qty = movement.quantity;

        switch (movement.type) {
          case 'RECEIPT':
            onHand += qty;
            available += qty;
            if (inTransit >= qty) inTransit -= qty;
            break;
          case 'DISPATCH':
            onHand = Math.max(0, onHand - qty);
            available = Math.max(0, available - qty);
            break;
          case 'RETURN':
            onHand += qty;
            available += qty;
            break;
          case 'ADJUSTMENT':
            onHand = Math.max(0, onHand + qty);
            available = Math.max(0, available + qty);
            break;
          case 'TRANSFER':
            onHand = Math.max(0, onHand - qty);
            available = Math.max(0, available - qty);
            inTransit += qty;
            break;
        }
        return { ...level, onHand, available, inTransit, lastUpdated: new Date().toISOString() };
      })
    );
  }
}
