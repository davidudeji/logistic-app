import {
  OrderStatus, LoadStatus, DriverStatus, VehicleStatus,
  RouteStopStatus, DeliveryStatus, ExceptionSeverity,
  ETAStatus, ExceptionStatus
} from '../models';

// ─── Badge CSS classes ────────────────────────────────────

export function orderStatusBadge(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING:    'badge-neutral',
    CONFIRMED:  'badge-info',
    READY:      'badge-brand',
    ASSIGNED:   'badge-brand',
    IN_TRANSIT: 'badge-info',
    DELIVERED:  'badge-success',
    FAILED:     'badge-error',
    CANCELLED:  'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

export function loadStatusBadge(status: LoadStatus): string {
  const map: Record<LoadStatus, string> = {
    PLANNING:   'badge-neutral',
    READY:      'badge-brand',
    DISPATCHED: 'badge-info',
    IN_TRANSIT: 'badge-info',
    COMPLETED:  'badge-success',
    CANCELLED:  'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

export function driverStatusBadge(status: DriverStatus): string {
  const map: Record<DriverStatus, string> = {
    AVAILABLE: 'badge-success',
    ASSIGNED:  'badge-brand',
    DRIVING:   'badge-info',
    OFFLINE:   'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

export function vehicleStatusBadge(status: VehicleStatus): string {
  const map: Record<VehicleStatus, string> = {
    AVAILABLE:   'badge-success',
    ASSIGNED:    'badge-brand',
    IN_TRANSIT:  'badge-info',
    MAINTENANCE: 'badge-warning',
    OFFLINE:     'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

export function deliveryStatusBadge(status: DeliveryStatus): string {
  const map: Record<DeliveryStatus, string> = {
    PENDING:          'badge-neutral',
    OUT_FOR_DELIVERY: 'badge-info',
    ARRIVED:          'badge-brand',
    DELIVERED:        'badge-success',
    FAILED:           'badge-error',
  };
  return map[status] ?? 'badge-neutral';
}

export function etaStatusBadge(status: ETAStatus): string {
  const map: Record<ETAStatus, string> = {
    ON_TIME: 'badge-success',
    AT_RISK: 'badge-warning',
    LATE:    'badge-error',
  };
  return map[status] ?? 'badge-neutral';
}

export function exceptionSeverityBadge(severity: ExceptionSeverity): string {
  const map: Record<ExceptionSeverity, string> = {
    LOW:      'badge-neutral',
    MEDIUM:   'badge-warning',
    HIGH:     'badge-error',
    CRITICAL: 'badge-error',
  };
  return map[severity] ?? 'badge-neutral';
}

export function exceptionStatusBadge(status: ExceptionStatus): string {
  const map: Record<ExceptionStatus, string> = {
    OPEN:         'badge-error',
    ACKNOWLEDGED: 'badge-warning',
    RESOLVED:     'badge-success',
  };
  return map[status] ?? 'badge-neutral';
}

export function stopStatusBadge(status: RouteStopStatus): string {
  const map: Record<RouteStopStatus, string> = {
    PENDING:   'badge-neutral',
    ARRIVED:   'badge-info',
    COMPLETED: 'badge-success',
    FAILED:    'badge-error',
  };
  return map[status] ?? 'badge-neutral';
}

// ─── Human-readable labels ────────────────────────────────

export function orderStatusLabel(s: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    PENDING: 'Pending', CONFIRMED: 'Confirmed', READY: 'Ready',
    ASSIGNED: 'Assigned', IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered', FAILED: 'Failed', CANCELLED: 'Cancelled',
  };
  return map[s] ?? s;
}

export function loadStatusLabel(s: LoadStatus): string {
  const map: Record<LoadStatus, string> = {
    PLANNING: 'Planning', READY: 'Ready', DISPATCHED: 'Dispatched',
    IN_TRANSIT: 'In Transit', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  };
  return map[s] ?? s;
}

export function driverStatusLabel(s: DriverStatus): string {
  const map: Record<DriverStatus, string> = {
    AVAILABLE: 'Available', ASSIGNED: 'Assigned', DRIVING: 'Driving', OFFLINE: 'Offline',
  };
  return map[s] ?? s;
}

export function vehicleStatusLabel(s: VehicleStatus): string {
  const map: Record<VehicleStatus, string> = {
    AVAILABLE: 'Available', ASSIGNED: 'Assigned', IN_TRANSIT: 'In Transit',
    MAINTENANCE: 'Maintenance', OFFLINE: 'Offline',
  };
  return map[s] ?? s;
}

export function exceptionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    LATE_DELIVERY:    'Late Delivery',
    ADDRESS_ERROR:    'Address Error',
    FAILED_ATTEMPT:   'Failed Attempt',
    VEHICLE_BREAKDOWN:'Vehicle Breakdown',
    DRIVER_DELAY:     'Driver Delay',
    ROUTE_DEVIATION:  'Route Deviation',
    CAPACITY_ISSUE:   'Capacity Issue',
  };
  return map[type] ?? type;
}

export function deliveryFailureLabel(reason: string): string {
  const map: Record<string, string> = {
    INCORRECT_ADDRESS:   'Incorrect Address',
    CUSTOMER_UNAVAILABLE:'Customer Unavailable',
    ACCESS_PROBLEM:      'Access Problem',
    REFUSED_DELIVERY:    'Refused Delivery',
    VEHICLE_ISSUE:       'Vehicle Issue',
    OTHER:               'Other',
  };
  return map[reason] ?? reason;
}

export function vehicleTypeLabel(type: string): string {
  const map: Record<string, string> = {
    VAN: 'Van', TRUCK: 'Truck', BIKE: 'Bike', CAR: 'Car',
  };
  return map[type] ?? type;
}
