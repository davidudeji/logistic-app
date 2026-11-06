// ─── Inventory Domain Models ────────────────────────────────────────────────

export type InventoryCategory =
  | 'FOOD_AND_BEVERAGE'
  | 'BUILDING_MATERIALS'
  | 'PHARMACEUTICALS'
  | 'ELECTRONICS'
  | 'AUTOMOTIVE_PARTS'
  | 'CHEMICALS'
  | 'TEXTILES'
  | 'AGRICULTURAL'
  | 'GENERAL_MERCHANDISE';

export type UnitOfMeasure =
  | 'BAG'
  | 'CARTON'
  | 'PALLET'
  | 'KG'
  | 'LITRE'
  | 'PIECE'
  | 'TON'
  | 'ROLL'
  | 'DRUM'
  | 'CRATE';

export type MovementType =
  | 'RECEIPT'
  | 'DISPATCH'
  | 'ADJUSTMENT'
  | 'TRANSFER'
  | 'RETURN';

export type AdjustmentReason =
  | 'THEFT'
  | 'DAMAGE'
  | 'EXPIRY'
  | 'COUNTING_ERROR'
  | 'SUPPLIER_RETURN'
  | 'WRITE_OFF'
  | 'OTHER';

export type StockStatus = 'OK' | 'LOW' | 'OUT';

// ─── Roles (modelled, no auth changes) ──────────────────────────────────────
export type InventoryRole =
  | 'INVENTORY_MANAGER'
  | 'WAREHOUSE_OFFICER'
  | 'AUDITOR'
  | 'VIEWER';

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  weightKg: number;
  unitOfMeasure: UnitOfMeasure;
  photos: string[];
  description: string;
  reorderPoint: number;
  safetyStock: number;
  unitCostNaira: number;
  customAttributes?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface StockLevel {
  itemId: string;
  warehouseId: string;
  onHand: number;
  reserved: number;
  available: number;
  inTransit: number;
  damaged: number;
  lastUpdated: string;
}

export interface StockMovement {
  id: string;
  itemId: string;
  warehouseId: string;
  type: MovementType;
  quantity: number;
  reference: string;
  reason: string;
  performedBy: string;
  createdAt: string;
  notes: string;
  adjustmentReason?: AdjustmentReason;
  shipmentLoadId?: string;  // links to Load.id when type is DISPATCH or TRANSFER
}

export interface WarehouseBasic {
  id: string;
  name: string;
  city: string;
  state: string;
}

// ─── Dispatch Orders ─────────────────────────────────────────────────────────

export type DispatchOrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PICKING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DispatchOrderLine {
  itemId: string;
  itemName: string;
  sku: string;
  orderedQty: number;
  pickedQty: number;
}

export interface DispatchOrder {
  id: string;
  customerId: string;
  customerName: string;
  warehouseId: string;
  warehouseName: string;
  lines: DispatchOrderLine[];
  status: DispatchOrderStatus;
  reference: string;
  notes: string;
  linkedLoadId?: string;  // ties to existing Load entity
  createdAt: string;
  updatedAt: string;
}

// ─── Proof of Delivery ────────────────────────────────────────────────────────

export type PodMethod = 'SIGNATURE' | 'PHOTO' | 'OTP';

export interface ProofOfDelivery {
  id: string;
  dispatchOrderId: string;
  method: PodMethod;
  value: string;         // base64 image, OTP code, or signature data URL
  deliveredAt: string;
  receivedBy: string;
  notes: string;
}

// ─── Cycle Count ──────────────────────────────────────────────────────────────

export interface CycleCountLine {
  itemId: string;
  itemName: string;
  sku: string;
  systemQty: number;
  physicalQty: number;
  variance: number;      // physicalQty - systemQty
  note: string;
}

export interface CycleCount {
  id: string;
  warehouseId: string;
  reference: string;
  performedBy: string;
  status: 'IN_PROGRESS' | 'POSTED';
  lines: CycleCountLine[];
  createdAt: string;
  postedAt?: string;
}

// ─── Returns / RMA ────────────────────────────────────────────────────────────

export type ReturnType = 'RESTOCK' | 'QUARANTINE' | 'WRITE_OFF';

export interface ReturnRecord {
  id: string;
  reference: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  quantity: number;
  returnType: ReturnType;
  returnReason: string;
  performedBy: string;
  notes: string;
  movementId: string;
  createdAt: string;
}

// ─── Computed / View Models ───────────────────────────────────────────────────

export interface LowStockAlert {
  item: InventoryItem;
  currentStock: number;
  reorderPoint: number;
}

export interface InventoryDashboardKpi {
  totalItems: number;
  totalValueNaira: number;
  lowStockCount: number;
  pendingReceipts: number;
  inTransitCount: number;
}

export interface InventoryItemView extends InventoryItem {
  stockLevel: StockLevel | null;
  status: StockStatus;
}
