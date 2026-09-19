import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Vehicle, VehicleStatus } from '../../shared/models';
import { MOCK_VEHICLES } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly _vehicles = signal<Vehicle[]>([...MOCK_VEHICLES]);

  readonly vehicles = this._vehicles.asReadonly();

  getVehicles(): Observable<Vehicle[]> {
    return of(this._vehicles()).pipe(delay(200));
  }

  getVehicle(id: string): Observable<Vehicle | undefined> {
    return of(this._vehicles().find(v => v.id === id)).pipe(delay(150));
  }

  getAvailableVehicles(): Vehicle[] {
    return this._vehicles().filter(v => v.status === 'AVAILABLE');
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Observable<Vehicle | undefined> {
    let updated: Vehicle | undefined;
    this._vehicles.update(vehicles => vehicles.map(v => {
      if (v.id === id) { updated = { ...v, ...updates }; return updated; }
      return v;
    }));
    return of(updated).pipe(delay(200));
  }

  updateStatus(id: string, status: VehicleStatus): Observable<Vehicle | undefined> {
    return this.updateVehicle(id, { status });
  }

  getMetrics() {
    const all = this._vehicles();
    return {
      total:       all.length,
      active:      all.filter(v => v.status === 'IN_TRANSIT').length,
      available:   all.filter(v => v.status === 'AVAILABLE').length,
      maintenance: all.filter(v => v.status === 'MAINTENANCE').length,
      offline:     all.filter(v => v.status === 'OFFLINE').length,
      assigned:    all.filter(v => v.status === 'ASSIGNED').length,
    };
  }
}
