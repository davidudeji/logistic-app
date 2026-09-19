import { Injectable, signal } from '@angular/core';
import { Observable, interval, map, startWith } from 'rxjs';
import { VehiclePosition } from '../../shared/models';
import { MOCK_VEHICLE_POSITIONS } from '../mock/mock-data';

/**
 * TrackingService — abstracts real-time vehicle tracking.
 * In production: replaces interval simulation with WebSocket stream.
 * The UI never knows whether the data is real or simulated.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private positions = signal<VehiclePosition[]>([...MOCK_VEHICLE_POSITIONS]);

  /** Simulated position stream — updates every 5 seconds */
  readonly vehiclePositions$ = interval(5000).pipe(
    startWith(0),
    map(() => {
      // Simulate slight movement for in-transit vehicles
      const updated = this.positions().map(p => ({
        ...p,
        latitude:  p.latitude  + (Math.random() - 0.5) * 0.005,
        longitude: p.longitude + (Math.random() - 0.5) * 0.005,
        speed: Math.max(0, p.speed + (Math.random() - 0.5) * 10),
        timestamp: new Date().toISOString(),
      }));
      this.positions.set(updated);
      return updated;
    })
  );

  getCurrentPositions(): VehiclePosition[] {
    return this.positions();
  }

  getPositionForVehicle(vehicleId: string): VehiclePosition | undefined {
    return this.positions().find(p => p.vehicleId === vehicleId);
  }
}
