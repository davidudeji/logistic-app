import { mapboxClient } from '../../config/mapbox.js';

export class EtaService {
  async predictEta(data) {
    const { assetId, deliveryId, origin, destination } = data;

    // Traffic weight bounded between 1.0 and 3.0
    const rawTrafficWeight = data.trafficWeight ?? 1.25;
    const trafficWeight = Math.min(3.0, Math.max(1.0, Number(rawTrafficWeight)));

    const directions = await mapboxClient.getDirections(origin, destination);

    const baselineDurationSeconds = Math.round(directions.durationSeconds);
    const predictedDurationSeconds = Math.round(baselineDurationSeconds * trafficWeight);

    const departureDate = new Date();
    const predictedArrivalDate = new Date(departureDate.getTime() + predictedDurationSeconds * 1000);

    return {
      assetId,
      deliveryId,
      baselineDurationSeconds,
      predictedDurationSeconds,
      distanceMeters: Math.round(directions.distanceMeters),
      trafficWeight,
      departureTimestamp: departureDate.toISOString(),
      predictedArrivalTimestamp: predictedArrivalDate.toISOString(),
      method: 'mapbox-directions-traffic-weighted',
    };
  }
}

export const etaService = new EtaService();
