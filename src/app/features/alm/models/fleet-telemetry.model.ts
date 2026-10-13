export interface DriverLocationBroadcast {
  assetId: string;
  longitude: number;
  latitude: number;
  telemetryTimestamp: string;
  heading?: number;
  speedKph?: number;
  accuracyMeters?: number;
}

export interface FleetTelemetryPing {
  eventId: string;
  assetId: string;
  longitude: number;
  latitude: number;
  telemetryTimestamp: string;
  receivedAt: string;
  heading?: number;
  speedKph?: number;
}

export interface VehicleTelemetryState {
  assetId: string;
  registrationNumber: string;
  driverName?: string;
  driverId?: string;
  longitude: number;
  latitude: number;
  heading: number;
  speedKph: number;
  lastUpdated: string;
  status: 'active' | 'idle' | 'stale' | 'offline';
  assignedRouteId?: string;
  assignedOrderId?: string;
  assignedDestination?: string;
}
