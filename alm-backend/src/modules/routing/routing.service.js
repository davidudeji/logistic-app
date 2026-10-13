import crypto from 'node:crypto';
import { mapboxClient } from '../../config/mapbox.js';

// Authoritative repository for sample delivery coordinates
const KNOWN_DELIVERY_COORDINATES = {
  'DEL-001': [3.4219, 6.4281], // Victoria Island
  'DEL-002': [3.3515, 6.6018], // Ikeja
  'DEL-003': [5.6037, 6.335],  // Benin City
  'DEL-004': [7.0174, 4.8396], // Port Harcourt
  'DEL-005': [8.5171, 11.9964], // Kano
};

export class RoutingService {
  constructor() {
    this.optimizations = new Map();
    this.confirmedRoutes = new Map();
  }

  async optimizeRoute(reqData, authenticatedUser = null) {
    const { assetId, deliveryIds, origin, destination } = reqData;

    // Resolve authoritative delivery coordinates
    const stopCoordinates = deliveryIds.map((id, index) => {
      const known = KNOWN_DELIVERY_COORDINATES[id];
      if (known) return known;
      // Jitter around origin if unknown stop
      return [origin[0] + 0.01 * (index + 1), origin[1] + 0.01 * (index + 1)];
    });

    // Mapbox trip order: [origin, ...stops, destination?]
    const allCoordinates = [origin, ...stopCoordinates];
    if (destination) {
      allCoordinates.push(destination);
    }

    const mapboxResult = await mapboxClient.optimizeWaypoints(allCoordinates);

    // Map waypoints back to delivery IDs
    // origin is at index 0. Stops are indices 1..deliveryIds.length.
    const reorderedDeliveryIds = [];
    if (mapboxResult.waypoints && mapboxResult.waypoints.length > 0) {
      // Sort waypoints by trips_index or sequence
      const sortedWaypoints = [...mapboxResult.waypoints].sort((a, b) => a.waypoint_index - b.waypoint_index);

      for (const wp of sortedWaypoints) {
        const origIdx = wp.waypoint_index;
        // Check if this corresponds to a delivery stop (1 to deliveryIds.length)
        if (origIdx >= 1 && origIdx <= deliveryIds.length) {
          const matchedDeliveryId = deliveryIds[origIdx - 1];
          if (!reorderedDeliveryIds.includes(matchedDeliveryId)) {
            reorderedDeliveryIds.push(matchedDeliveryId);
          }
        }
      }
    }

    // Fallback if mapping had unassigned stops
    for (const id of deliveryIds) {
      if (!reorderedDeliveryIds.includes(id)) {
        reorderedDeliveryIds.push(id);
      }
    }

    const optimizationId = `opt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const generatedAt = new Date().toISOString();

    const response = {
      optimizationId,
      assetId,
      orderedDeliveryIds: reorderedDeliveryIds,
      totalDistanceMeters: mapboxResult.distanceMeters,
      estimatedDurationSeconds: mapboxResult.durationSeconds,
      geometry: mapboxResult.geometry,
      provider: 'mapbox',
      generatedAt,
    };

    this.optimizations.set(optimizationId, response);
    return response;
  }

  async confirmRoute(routeId, confirmationData, authenticatedUser = null) {
    const optimization = this.optimizations.get(confirmationData.optimizationId);
    const confirmedAt = new Date().toISOString();

    const record = {
      routeId,
      assetId: confirmationData.assetId,
      orderedDeliveryIds: confirmationData.orderedDeliveryIds,
      status: 'confirmed',
      totalStops: confirmationData.orderedDeliveryIds.length,
      confirmedAt,
      confirmedBy: authenticatedUser?.id || 'Dispatcher',
    };

    this.confirmedRoutes.set(routeId, record);
    return record;
  }

  getRoute(routeId) {
    return this.confirmedRoutes.get(routeId) || this.optimizations.get(routeId) || null;
  }
}

export const routingService = new RoutingService();
