// ─── Address ─────────────────────────────────────────────
export interface Address {
  id: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  postalCode?: string;
  verified: boolean;
}

// ─── GeoLocation ─────────────────────────────────────────
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

// ─── Customer ─────────────────────────────────────────────
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address: Address;
}

// ─── Package ──────────────────────────────────────────────
export interface Package {
  id: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description?: string;
}

// ─── DeliveryWindow ──────────────────────────────────────
export interface DeliveryWindow {
  start: string; // ISO datetime
  end: string;   // ISO datetime
}

// ─── Order ────────────────────────────────────────────────
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'ASSIGNED'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export type OrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  packages: Package[];
  priority: OrderPriority;
  deliveryWindow?: DeliveryWindow;
  status: OrderStatus;
  loadId?: string;
  driverId?: string;
  vehicleId?: string;
  eta?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Load ─────────────────────────────────────────────────
export type LoadStatus =
  | 'PLANNING'
  | 'READY'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Load {
  id: string;
  reference: string;
  orderIds: string[];
  driverId?: string;
  vehicleId?: string;
  routeId?: string;
  carrierId?: string;
  status: LoadStatus;
  scheduledDate: string;
  totalStops: number;
  completedStops: number;
  totalWeight?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Driver ───────────────────────────────────────────────
export type DriverStatus = 'AVAILABLE' | 'ASSIGNED' | 'DRIVING' | 'OFFLINE';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  email?: string;
  licenseNumber?: string;
  status: DriverStatus;
  currentVehicleId?: string;
  currentLoadId?: string;
  currentLocation?: GeoLocation;
  onTimeRate?: number;
  totalDeliveries?: number;
  avatarInitials: string;
}

// ─── Vehicle ──────────────────────────────────────────────
export type VehicleType = 'VAN' | 'TRUCK' | 'BIKE' | 'CAR';
export type VehicleStatus = 'AVAILABLE' | 'ASSIGNED' | 'IN_TRANSIT' | 'MAINTENANCE' | 'OFFLINE';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  capacity: number; // kg
  status: VehicleStatus;
  fuelLevel?: number; // percentage 0-100
  currentLocation?: GeoLocation;
  currentDriverId?: string;
  currentLoadId?: string;
  make?: string;
  model?: string;
  year?: number;
}

// ─── Route ────────────────────────────────────────────────
export type RouteStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type RouteStopStatus = 'PENDING' | 'ARRIVED' | 'COMPLETED' | 'FAILED';

export interface RouteStop {
  id: string;
  orderId: string;
  sequence: number;
  address: Address;
  estimatedArrival?: string;
  actualArrival?: string;
  status: RouteStopStatus;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
}

export interface Route {
  id: string;
  loadId: string;
  stops: RouteStop[];
  totalDistance: number; // km
  estimatedDuration: number; // minutes
  status: RouteStatus;
  optimized?: boolean;
  createdAt: string;
}

// ─── Vehicle Position (Tracking) ─────────────────────────
export interface VehiclePosition {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number; // km/h
  heading?: number; // degrees
  timestamp: string;
}

// ─── Delivery ETA ─────────────────────────────────────────
export type ETAStatus = 'ON_TIME' | 'AT_RISK' | 'LATE';

export interface DeliveryETA {
  stopId: string;
  estimatedArrival: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  status: ETAStatus;
}

// ─── Delivery ─────────────────────────────────────────────
export type DeliveryStatus = 'PENDING' | 'OUT_FOR_DELIVERY' | 'ARRIVED' | 'DELIVERED' | 'FAILED';

export type DeliveryFailureReason =
  | 'INCORRECT_ADDRESS'
  | 'CUSTOMER_UNAVAILABLE'
  | 'ACCESS_PROBLEM'
  | 'REFUSED_DELIVERY'
  | 'VEHICLE_ISSUE'
  | 'OTHER';

export interface Delivery {
  id: string;
  orderId: string;
  stopId?: string;
  status: DeliveryStatus;
  attemptedAt?: string;
  completedAt?: string;
  failureReason?: DeliveryFailureReason;
  failureNotes?: string;
  proofImageUrl?: string;
  recipientName?: string;
  exceptionId?: string;
}

// ─── Exception ────────────────────────────────────────────
export type ExceptionType =
  | 'LATE_DELIVERY'
  | 'ADDRESS_ERROR'
  | 'FAILED_ATTEMPT'
  | 'VEHICLE_BREAKDOWN'
  | 'DRIVER_DELAY'
  | 'ROUTE_DEVIATION'
  | 'CAPACITY_ISSUE';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface DeliveryException {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  loadId?: string;
  orderId?: string;
  vehicleId?: string;
  driverId?: string;
  description: string;
  status: ExceptionStatus;
  assignedTo?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ─── Carrier ──────────────────────────────────────────────
export type CarrierType = 'OWN_FLEET' | 'THIRD_PARTY' | 'PARCEL' | 'INDEPENDENT';
export type CarrierStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Carrier {
  id: string;
  name: string;
  type: CarrierType;
  status: CarrierStatus;
  onTimeRate?: number;
  failureRate?: number;
  costPerKm?: number;
  activeLoads?: number;
  totalDeliveries?: number;
  contactEmail?: string;
  contactPhone?: string;
}

// ─── Dashboard KPI ────────────────────────────────────────
export interface DashboardKpi {
  activeLoads: number;
  activeVehicles: number;
  onTimeDeliveryPct: number;
  atRiskDeliveries: number;
  failedDeliveries: number;
  fuelCostToday: string;
  totalRevenue: string;
  activeDrivers: number;
  criticalExceptions: number;
  deliveredToday: number;
}

// ─── Analytics ────────────────────────────────────────────
export interface AnalyticsSummary {
  period: string;
  deliveryPerformance: number;
  onTimePct: number;
  failedAttempts: number;
  avgDeliveryTimeMin: number;
  avgRouteDistanceKm: number;
  costPerDelivery: number;
  fuelCostTotal: string;
  vehicleUtilizationPct: number;
  topCarrier?: string;
}
