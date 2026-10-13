import { config } from './env.js';

export class MapboxClient {
  constructor() {
    this.token = config.mapbox.token;
    this.timeoutMs = config.mapbox.timeoutMs;
  }

  isConfigured() {
    return !!this.token && !this.token.includes('sample_');
  }

  /**
   * Optimizes stop sequence given an array of coordinates [[lng, lat], ...]
   */
  async optimizeWaypoints(coordinates) {
    if (this.isConfigured() && coordinates.length >= 2 && coordinates.length <= 12) {
      try {
        const coordString = coordinates.map((c) => `${c[0]},${c[1]}`).join(';');
        const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordString}?access_token=${this.token}&geometries=geojson&roundtrip=false&source=first`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data.trips && data.trips.length > 0) {
            const trip = data.trips[0];
            return {
              waypoints: data.waypoints,
              distanceMeters: trip.distance,
              durationSeconds: trip.duration,
              geometry: trip.geometry,
            };
          }
        }
      } catch (err) {
        console.warn('[MapboxClient] External API call failed, falling back to local optimization engine:', err.message);
      }
    }

    // Local deterministic optimization engine (computes efficient sequence)
    return this.fallbackOptimize(coordinates);
  }

  /**
   * Predicts route duration between origin and destination with traffic considerations
   */
  async getDirections(origin, destination) {
    if (this.isConfigured()) {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?access_token=${this.token}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
              durationSeconds: route.duration,
              distanceMeters: route.distance,
            };
          }
        }
      } catch (err) {
        console.warn('[MapboxClient] Directions call failed, using fallback calculation:', err.message);
      }
    }

    // Fallback: haversine calculation
    const distMeters = this.haversineDistance(origin, destination);
    // Baseline speed: ~40 km/h (11 m/s) in urban/highway mix
    const durationSeconds = Math.round(distMeters / 11.1);

    return {
      durationSeconds,
      distanceMeters: distMeters,
    };
  }

  fallbackOptimize(coordinates) {
    // Sort waypoints by closest neighbor starting from origin
    const n = coordinates.length;
    const visited = new Array(n).fill(false);
    const order = [0];
    visited[0] = true;

    let current = 0;
    let totalDist = 0;

    for (let step = 1; step < n; step++) {
      let nearest = -1;
      let minDist = Infinity;

      for (let i = 1; i < n; i++) {
        if (!visited[i]) {
          const d = this.haversineDistance(coordinates[current], coordinates[i]);
          if (d < minDist) {
            minDist = d;
            nearest = i;
          }
        }
      }

      if (nearest !== -1) {
        visited[nearest] = true;
        order.push(nearest);
        totalDist += minDist;
        current = nearest;
      }
    }

    const durationSeconds = Math.round(totalDist / 10.5);

    return {
      waypoints: order.map((origIdx, waypointIdx) => ({
        waypoint_index: origIdx,
        trips_index: 0,
      })),
      distanceMeters: Math.round(totalDist),
      durationSeconds,
      geometry: {
        type: 'LineString',
        coordinates: order.map((idx) => coordinates[idx]),
      },
    };
  }

  haversineDistance(c1, c2) {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (c1[1] * Math.PI) / 180;
    const phi2 = (c2[1] * Math.PI) / 180;
    const deltaPhi = ((c2[1] - c1[1]) * Math.PI) / 180;
    const deltaLambda = ((c2[0] - c1[0]) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }
}

export const mapboxClient = new MapboxClient();
