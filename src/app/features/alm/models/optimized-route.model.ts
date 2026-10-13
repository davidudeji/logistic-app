export interface OptimizeRouteRequest {
  assetId: string;
  deliveryIds: string[];
  origin: [number, number]; // [longitude, latitude]
  destination?: [number, number]; // [longitude, latitude]
  departureAt?: string;
}

export interface OptimizedRouteResponse {
  optimizationId: string;
  assetId: string;
  orderedDeliveryIds: string[];
  totalDistanceMeters: number;
  estimatedDurationSeconds: number;
  geometry?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  provider: 'mapbox';
  generatedAt: string;
}

export interface RouteStopDetail {
  deliveryId: string;
  sequence: number;
  recipientName: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  estimatedArrival?: string;
  distanceFromPreviousMeters?: number;
}

export interface RouteConfirmationRequest {
  optimizationId: string;
  assetId: string;
  driverId?: string;
  orderedDeliveryIds: string[];
}

export interface RouteConfirmationResponse {
  routeId: string;
  assetId: string;
  status: 'confirmed' | 'active';
  totalStops: number;
  confirmedAt: string;
}
