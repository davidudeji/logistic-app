import {
  Customer, Order, Load, Driver, Vehicle, Route, Delivery,
  DeliveryException, Carrier, DashboardKpi, VehiclePosition,
  Address
} from '../../shared/models';

// ─── Helpers ─────────────────────────────────────────────

function addr(
  id: string, formatted: string, city: string, state: string,
  lat: number, lng: number, postalCode?: string
): Address {
  return { id, formattedAddress: formatted, city, state, postalCode, latitude: lat, longitude: lng, verified: true };
}

// ─── Customers ────────────────────────────────────────────

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'Zenith Industrials Ltd', email: 'ops@zenith.ng', phone: '+234 801 234 5678',
    address: addr('A-C1', '14 Adeola Odeku St, Victoria Island', 'Lagos', 'Lagos', 6.4281, 3.4219, '101001') },
  { id: 'CUST-002', name: 'Afra Pharmaceuticals', email: 'supply@afra.ng', phone: '+234 802 345 6789',
    address: addr('A-C2', '3 Independence Avenue, CBD', 'Abuja', 'FCT', 9.0579, 7.4951, '900001') },
  { id: 'CUST-003', name: 'Kano Grains Cooperative', email: 'info@kanograins.ng', phone: '+234 803 456 7890',
    address: addr('A-C3', '21 Kofar Wambai Market', 'Kano', 'Kano', 11.9964, 8.5171, '700001') },
  { id: 'CUST-004', name: 'Port Harcourt Petrolink', email: 'logistics@petrolink.ng', phone: '+234 804 567 8901',
    address: addr('A-C4', '7 Trans Amadi Industrial Layout', 'Port Harcourt', 'Rivers', 4.8396, 7.0174, '500001') },
  { id: 'CUST-005', name: 'BrightBuild Supplies', email: 'orders@brightbuild.ng', phone: '+234 805 678 9012',
    address: addr('A-C5', '55 Sapele Road, GRA', 'Benin City', 'Edo', 6.3350, 5.6037, '300001') },
  { id: 'CUST-006', name: 'NorthStar Electronics', email: 'store@northstar.ng', phone: '+234 806 789 0123',
    address: addr('A-C6', '12 Ali Akilu Road', 'Kaduna', 'Kaduna', 10.5265, 7.4390, '800001') },
];

// ─── Drivers ──────────────────────────────────────────────

export const MOCK_DRIVERS: Driver[] = [
  { id: 'DRV-001', name: 'John Okafor',   phone: '+234 801 111 2222', email: 'j.okafor@fleet.ng',
    status: 'DRIVING',    currentVehicleId: 'VEH-TRK-101', currentLoadId: 'LD-1001',
    currentLocation: { latitude: 6.6018, longitude: 3.3515 }, onTimeRate: 96.2, totalDeliveries: 1240,
    avatarInitials: 'JO' },
  { id: 'DRV-002', name: 'Sarah Williams', phone: '+234 802 222 3333', email: 's.williams@fleet.ng',
    status: 'DRIVING',    currentVehicleId: 'VEH-VAN-201', currentLoadId: 'LD-1002',
    currentLocation: { latitude: 9.0620, longitude: 7.4980 }, onTimeRate: 91.8, totalDeliveries: 874,
    avatarInitials: 'SW' },
  { id: 'DRV-003', name: 'Michael Adams',  phone: '+234 803 333 4444', email: 'm.adams@fleet.ng',
    status: 'AVAILABLE',  currentVehicleId: undefined, currentLoadId: undefined,
    currentLocation: { latitude: 6.4550, longitude: 3.3841 }, onTimeRate: 88.5, totalDeliveries: 631,
    avatarInitials: 'MA' },
  { id: 'DRV-004', name: 'Ngozi Eze',      phone: '+234 804 444 5555', email: 'n.eze@fleet.ng',
    status: 'ASSIGNED',   currentVehicleId: 'VEH-TRK-102', currentLoadId: 'LD-1003',
    currentLocation: { latitude: 11.9700, longitude: 8.5400 }, onTimeRate: 94.1, totalDeliveries: 920,
    avatarInitials: 'NE' },
  { id: 'DRV-005', name: 'Emeka Chukwu',   phone: '+234 805 555 6666', email: 'e.chukwu@fleet.ng',
    status: 'OFFLINE',    currentVehicleId: undefined, currentLoadId: undefined,
    currentLocation: undefined, onTimeRate: 82.0, totalDeliveries: 445,
    avatarInitials: 'EC' },
  { id: 'DRV-006', name: 'Amina Bello',    phone: '+234 806 666 7777', email: 'a.bello@fleet.ng',
    status: 'DRIVING',    currentVehicleId: 'VEH-VAN-202', currentLoadId: 'LD-1004',
    currentLocation: { latitude: 4.8150, longitude: 7.0400 }, onTimeRate: 97.3, totalDeliveries: 1502,
    avatarInitials: 'AB' },
];

// ─── Vehicles ─────────────────────────────────────────────

export const MOCK_VEHICLES: Vehicle[] = [
  { id: 'VEH-TRK-101', registrationNumber: 'TRK-101', type: 'TRUCK',
    capacity: 5000, status: 'IN_TRANSIT', fuelLevel: 72,
    currentLocation: { latitude: 6.6018, longitude: 3.3515 },
    currentDriverId: 'DRV-001', currentLoadId: 'LD-1001',
    make: 'Isuzu', model: 'NPS75', year: 2022 },
  { id: 'VEH-TRK-102', registrationNumber: 'TRK-102', type: 'TRUCK',
    capacity: 4000, status: 'ASSIGNED', fuelLevel: 55,
    currentLocation: { latitude: 11.9700, longitude: 8.5400 },
    currentDriverId: 'DRV-004', currentLoadId: 'LD-1003',
    make: 'MAN', model: 'TGS 26.360', year: 2021 },
  { id: 'VEH-VAN-201', registrationNumber: 'VAN-201', type: 'VAN',
    capacity: 1200, status: 'IN_TRANSIT', fuelLevel: 88,
    currentLocation: { latitude: 9.0620, longitude: 7.4980 },
    currentDriverId: 'DRV-002', currentLoadId: 'LD-1002',
    make: 'Toyota', model: 'Hiace', year: 2023 },
  { id: 'VEH-VAN-202', registrationNumber: 'VAN-202', type: 'VAN',
    capacity: 1200, status: 'IN_TRANSIT', fuelLevel: 43,
    currentLocation: { latitude: 4.8150, longitude: 7.0400 },
    currentDriverId: 'DRV-006', currentLoadId: 'LD-1004',
    make: 'Toyota', model: 'Hiace', year: 2022 },
  { id: 'VEH-VAN-203', registrationNumber: 'VAN-203', type: 'VAN',
    capacity: 1000, status: 'AVAILABLE', fuelLevel: 95,
    currentLocation: { latitude: 6.4550, longitude: 3.3841 },
    currentDriverId: undefined, make: 'Ford', model: 'Transit', year: 2023 },
  { id: 'VEH-TRK-103', registrationNumber: 'TRK-103', type: 'TRUCK',
    capacity: 6000, status: 'MAINTENANCE', fuelLevel: 30,
    currentLocation: { latitude: 6.4281, longitude: 3.4219 },
    make: 'DAF', model: 'XF 480', year: 2020 },
  { id: 'VEH-CAR-301', registrationNumber: 'CAR-301', type: 'CAR',
    capacity: 200, status: 'AVAILABLE', fuelLevel: 100,
    currentLocation: { latitude: 9.0579, longitude: 7.4951 },
    make: 'Toyota', model: 'Corolla', year: 2023 },
];

// ─── Orders ───────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-1001', customerId: 'CUST-001', customerName: 'Zenith Industrials Ltd',
    pickupAddress: addr('PA-1', '5 Wharf Road, Apapa', 'Lagos', 'Lagos', 6.4474, 3.3668),
    deliveryAddress: addr('DA-1', '14 Adeola Odeku St, VI', 'Lagos', 'Lagos', 6.4281, 3.4219),
    packages: [{ id: 'PKG-1001a', weight: 450, description: 'Industrial components' }],
    priority: 'HIGH', status: 'IN_TRANSIT', loadId: 'LD-1001', driverId: 'DRV-001',
    vehicleId: 'VEH-TRK-101', eta: '2026-09-19T10:30:00+01:00',
    deliveryWindow: { start: '2026-09-19T09:00:00+01:00', end: '2026-09-19T12:00:00+01:00' },
    createdAt: '2026-09-18T08:00:00+01:00', updatedAt: '2026-09-19T06:00:00+01:00' },

  { id: 'ORD-1002', customerId: 'CUST-002', customerName: 'Afra Pharmaceuticals',
    pickupAddress: addr('PA-2', 'Ikeja Pharmaceutical Hub', 'Lagos', 'Lagos', 6.6018, 3.3515),
    deliveryAddress: addr('DA-2', '3 Independence Avenue, Abuja', 'Abuja', 'FCT', 9.0579, 7.4951),
    packages: [{ id: 'PKG-1002a', weight: 120, description: 'Medical supplies — temperature controlled' }],
    priority: 'URGENT', status: 'IN_TRANSIT', loadId: 'LD-1002', driverId: 'DRV-002',
    vehicleId: 'VEH-VAN-201', eta: '2026-09-19T14:00:00+01:00',
    deliveryWindow: { start: '2026-09-19T13:00:00+01:00', end: '2026-09-19T15:00:00+01:00' },
    createdAt: '2026-09-18T09:00:00+01:00', updatedAt: '2026-09-19T06:30:00+01:00' },

  { id: 'ORD-1003', customerId: 'CUST-003', customerName: 'Kano Grains Cooperative',
    pickupAddress: addr('PA-3', 'Kano State Grain Depot', 'Kano', 'Kano', 12.0022, 8.5919),
    deliveryAddress: addr('DA-3', '21 Kofar Wambai Market', 'Kano', 'Kano', 11.9964, 8.5171),
    packages: [
      { id: 'PKG-1003a', weight: 2000, description: 'Sorghum — 50kg bags x40' },
      { id: 'PKG-1003b', weight: 1500, description: 'Millet — 50kg bags x30' },
    ],
    priority: 'NORMAL', status: 'ASSIGNED', loadId: 'LD-1003', driverId: 'DRV-004',
    vehicleId: 'VEH-TRK-102',
    deliveryWindow: { start: '2026-09-19T08:00:00+01:00', end: '2026-09-19T17:00:00+01:00' },
    createdAt: '2026-09-18T10:00:00+01:00', updatedAt: '2026-09-19T05:00:00+01:00' },

  { id: 'ORD-1004', customerId: 'CUST-004', customerName: 'Port Harcourt Petrolink',
    pickupAddress: addr('PA-4', 'Eleme Industrial Zone', 'Port Harcourt', 'Rivers', 4.7553, 7.1164),
    deliveryAddress: addr('DA-4', '7 Trans Amadi Layout', 'Port Harcourt', 'Rivers', 4.8396, 7.0174),
    packages: [{ id: 'PKG-1004a', weight: 600, description: 'Pipe fittings' }],
    priority: 'HIGH', status: 'IN_TRANSIT', loadId: 'LD-1004', driverId: 'DRV-006',
    vehicleId: 'VEH-VAN-202', eta: '2026-09-19T11:45:00+01:00',
    deliveryWindow: { start: '2026-09-19T10:00:00+01:00', end: '2026-09-19T12:00:00+01:00' },
    createdAt: '2026-09-18T11:00:00+01:00', updatedAt: '2026-09-19T07:00:00+01:00' },

  { id: 'ORD-1005', customerId: 'CUST-005', customerName: 'BrightBuild Supplies',
    pickupAddress: addr('PA-5', 'Sapele Road Warehouse', 'Benin City', 'Edo', 6.3500, 5.6000),
    deliveryAddress: addr('DA-5', '55 Sapele Road GRA', 'Benin City', 'Edo', 6.3350, 5.6037),
    packages: [{ id: 'PKG-1005a', weight: 900, description: 'Cement — 50kg bags x18' }],
    priority: 'LOW', status: 'READY',
    deliveryWindow: { start: '2026-09-19T14:00:00+01:00', end: '2026-09-19T18:00:00+01:00' },
    createdAt: '2026-09-18T12:00:00+01:00', updatedAt: '2026-09-19T05:00:00+01:00' },

  { id: 'ORD-1006', customerId: 'CUST-006', customerName: 'NorthStar Electronics',
    pickupAddress: addr('PA-6', 'Kawo Industrial Area', 'Kaduna', 'Kaduna', 10.5400, 7.4200),
    deliveryAddress: addr('DA-6', '12 Ali Akilu Road', 'Kaduna', 'Kaduna', 10.5265, 7.4390),
    packages: [{ id: 'PKG-1006a', weight: 80, description: 'Laptops and accessories' }],
    priority: 'URGENT', status: 'PENDING',
    createdAt: '2026-09-19T04:00:00+01:00', updatedAt: '2026-09-19T04:00:00+01:00' },
];

// ─── Loads ────────────────────────────────────────────────

export const MOCK_LOADS: Load[] = [
  { id: 'LD-1001', reference: 'LD-1001', orderIds: ['ORD-1001'],
    driverId: 'DRV-001', vehicleId: 'VEH-TRK-101', routeId: 'RT-001',
    status: 'IN_TRANSIT', scheduledDate: '2026-09-19', totalStops: 2, completedStops: 0,
    totalWeight: 450, createdAt: '2026-09-18T08:00:00+01:00', updatedAt: '2026-09-19T06:00:00+01:00' },

  { id: 'LD-1002', reference: 'LD-1002', orderIds: ['ORD-1002'],
    driverId: 'DRV-002', vehicleId: 'VEH-VAN-201', routeId: 'RT-002',
    status: 'IN_TRANSIT', scheduledDate: '2026-09-19', totalStops: 2, completedStops: 1,
    totalWeight: 120, createdAt: '2026-09-18T09:00:00+01:00', updatedAt: '2026-09-19T06:30:00+01:00' },

  { id: 'LD-1003', reference: 'LD-1003', orderIds: ['ORD-1003'],
    driverId: 'DRV-004', vehicleId: 'VEH-TRK-102', routeId: 'RT-003',
    status: 'DISPATCHED', scheduledDate: '2026-09-19', totalStops: 2, completedStops: 0,
    totalWeight: 3500, createdAt: '2026-09-18T10:00:00+01:00', updatedAt: '2026-09-19T05:00:00+01:00' },

  { id: 'LD-1004', reference: 'LD-1004', orderIds: ['ORD-1004'],
    driverId: 'DRV-006', vehicleId: 'VEH-VAN-202', routeId: 'RT-004',
    status: 'IN_TRANSIT', scheduledDate: '2026-09-19', totalStops: 2, completedStops: 0,
    totalWeight: 600, createdAt: '2026-09-18T11:00:00+01:00', updatedAt: '2026-09-19T07:00:00+01:00' },

  { id: 'LD-1005', reference: 'LD-1005', orderIds: ['ORD-1005'],
    status: 'READY', scheduledDate: '2026-09-19', totalStops: 2, completedStops: 0,
    totalWeight: 900, createdAt: '2026-09-18T12:00:00+01:00', updatedAt: '2026-09-19T05:00:00+01:00' },
];

// ─── Routes ───────────────────────────────────────────────

export const MOCK_ROUTES: Route[] = [
  { id: 'RT-001', loadId: 'LD-1001', totalDistance: 22, estimatedDuration: 55, status: 'ACTIVE', optimized: true,
    createdAt: '2026-09-18T08:30:00+01:00',
    stops: [
      { id: 'RS-001a', orderId: 'ORD-1001', sequence: 1,
        address: addr('DA-P1', '5 Wharf Road, Apapa', 'Lagos', 'Lagos', 6.4474, 3.3668),
        estimatedArrival: '2026-09-19T08:00:00+01:00', status: 'COMPLETED',
        deliveryWindowStart: '2026-09-19T07:30:00+01:00', deliveryWindowEnd: '2026-09-19T09:00:00+01:00' },
      { id: 'RS-001b', orderId: 'ORD-1001', sequence: 2,
        address: addr('DA-1', '14 Adeola Odeku St, VI', 'Lagos', 'Lagos', 6.4281, 3.4219),
        estimatedArrival: '2026-09-19T10:30:00+01:00', status: 'PENDING',
        deliveryWindowStart: '2026-09-19T09:00:00+01:00', deliveryWindowEnd: '2026-09-19T12:00:00+01:00' },
    ]
  },
  { id: 'RT-002', loadId: 'LD-1002', totalDistance: 538, estimatedDuration: 420, status: 'ACTIVE', optimized: true,
    createdAt: '2026-09-18T09:30:00+01:00',
    stops: [
      { id: 'RS-002a', orderId: 'ORD-1002', sequence: 1,
        address: addr('PA-2', 'Ikeja Hub', 'Lagos', 'Lagos', 6.6018, 3.3515),
        estimatedArrival: '2026-09-19T07:00:00+01:00', status: 'COMPLETED',
        deliveryWindowStart: '2026-09-19T06:30:00+01:00', deliveryWindowEnd: '2026-09-19T08:00:00+01:00' },
      { id: 'RS-002b', orderId: 'ORD-1002', sequence: 2,
        address: addr('DA-2', '3 Independence Ave, Abuja', 'Abuja', 'FCT', 9.0579, 7.4951),
        estimatedArrival: '2026-09-19T14:00:00+01:00', status: 'PENDING',
        deliveryWindowStart: '2026-09-19T13:00:00+01:00', deliveryWindowEnd: '2026-09-19T15:00:00+01:00' },
    ]
  },
];

// ─── Deliveries ───────────────────────────────────────────

export const MOCK_DELIVERIES: Delivery[] = [
  { id: 'DEL-001', orderId: 'ORD-1001', stopId: 'RS-001b', status: 'OUT_FOR_DELIVERY' },
  { id: 'DEL-002', orderId: 'ORD-1002', stopId: 'RS-002b', status: 'OUT_FOR_DELIVERY' },
  { id: 'DEL-003', orderId: 'ORD-1003', status: 'PENDING' },
  { id: 'DEL-004', orderId: 'ORD-1004', status: 'OUT_FOR_DELIVERY' },
  { id: 'DEL-005', orderId: 'ORD-1005', status: 'PENDING' },
];

// ─── Exceptions ───────────────────────────────────────────

export const MOCK_EXCEPTIONS: DeliveryException[] = [
  { id: 'EXC-001', type: 'VEHICLE_BREAKDOWN', severity: 'CRITICAL',
    vehicleId: 'VEH-TRK-102', loadId: 'LD-1003', driverId: 'DRV-004',
    description: 'Vehicle TRK-102 reported engine failure near Kano depot. Load LD-1003 is stranded.',
    status: 'OPEN', createdAt: '2026-09-19T04:15:00+01:00' },

  { id: 'EXC-002', type: 'LATE_DELIVERY', severity: 'HIGH',
    loadId: 'LD-1004', orderId: 'ORD-1004', driverId: 'DRV-006',
    description: 'LD-1004 is at risk of missing delivery window (10:00–12:00). ETA now 11:45.',
    status: 'ACKNOWLEDGED', assignedTo: 'Dispatcher A',
    createdAt: '2026-09-19T05:00:00+01:00' },

  { id: 'EXC-003', type: 'ADDRESS_ERROR', severity: 'MEDIUM',
    orderId: 'ORD-1006',
    description: 'Order ORD-1006 delivery address could not be geocoded. Manual verification required.',
    status: 'OPEN', createdAt: '2026-09-19T04:05:00+01:00' },

  { id: 'EXC-004', type: 'DRIVER_DELAY', severity: 'LOW',
    loadId: 'LD-1002', driverId: 'DRV-002',
    description: 'Driver DRV-002 reported 20-minute delay at Abuja checkpoint.',
    status: 'RESOLVED', resolvedAt: '2026-09-19T03:30:00+01:00',
    createdAt: '2026-09-19T03:00:00+01:00' },
];

// ─── Carriers ─────────────────────────────────────────────

export const MOCK_CARRIERS: Carrier[] = [
  { id: 'CAR-001', name: 'Own Fleet', type: 'OWN_FLEET', status: 'ACTIVE',
    onTimeRate: 94.2, failureRate: 2.1, costPerKm: 85, activeLoads: 4, totalDeliveries: 5240 },
  { id: 'CAR-002', name: 'Redstar Express', type: 'PARCEL', status: 'ACTIVE',
    onTimeRate: 87.5, failureRate: 4.3, costPerKm: 120, activeLoads: 2, totalDeliveries: 1830 },
  { id: 'CAR-003', name: 'GIG Logistics', type: 'THIRD_PARTY', status: 'ACTIVE',
    onTimeRate: 89.1, failureRate: 3.8, costPerKm: 110, activeLoads: 1, totalDeliveries: 2100 },
];

// ─── Dashboard KPI ────────────────────────────────────────

export const MOCK_DASHBOARD_KPI: DashboardKpi = {
  activeLoads: 142,
  activeVehicles: 61,
  onTimeDeliveryPct: 91,
  atRiskDeliveries: 7,
  failedDeliveries: 4,
  fuelCostToday: '₦1.24M',
  totalRevenue: '₦4.87M',
  activeDrivers: 43,
  criticalExceptions: 2,
  deliveredToday: 18,
};

// ─── Vehicle Positions (for live tracking) ────────────────

export const MOCK_VEHICLE_POSITIONS: VehiclePosition[] = [
  { vehicleId: 'VEH-TRK-101', latitude: 6.6018, longitude: 3.3515, speed: 62, heading: 45, timestamp: new Date().toISOString() },
  { vehicleId: 'VEH-VAN-201', latitude: 9.0620, longitude: 7.4980, speed: 88, heading: 20, timestamp: new Date().toISOString() },
  { vehicleId: 'VEH-TRK-102', latitude: 11.9700, longitude: 8.5400, speed: 0,  heading: 0,  timestamp: new Date().toISOString() },
  { vehicleId: 'VEH-VAN-202', latitude: 4.8150,  longitude: 7.0400, speed: 55, heading: 180,timestamp: new Date().toISOString() },
];
