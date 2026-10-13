export interface PredictEtaRequest {
  assetId: string;
  deliveryId: string;
  origin: [number, number]; // [longitude, latitude]
  destination: [number, number]; // [longitude, latitude]
  trafficWeight?: number;
}

export interface PredictEtaResponse {
  assetId: string;
  deliveryId: string;
  baselineDurationSeconds: number;
  predictedDurationSeconds: number;
  distanceMeters: number;
  trafficWeight: number;
  departureTimestamp: string;
  predictedArrivalTimestamp: string;
  method: string;
}

export interface EtaDisplayCardData {
  deliveryId: string;
  assetId: string;
  destinationAddress: string;
  predictedArrivalTime: string;
  remainingMinutes: number;
  remainingDistanceKm: number;
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  trafficMultiplier: number;
  confidenceScore: number; // 0-100%
  lastCalculatedAt: string;
}
