import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Driver, DriverStatus } from '../../shared/models';
import { MOCK_DRIVERS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly _drivers = signal<Driver[]>([...MOCK_DRIVERS]);

  readonly drivers = this._drivers.asReadonly();

  getDrivers(): Observable<Driver[]> {
    return of(this._drivers()).pipe(delay(200));
  }

  getDriver(id: string): Observable<Driver | undefined> {
    return of(this._drivers().find(d => d.id === id)).pipe(delay(150));
  }

  getAvailableDrivers(): Driver[] {
    return this._drivers().filter(d => d.status === 'AVAILABLE');
  }

  updateDriver(id: string, updates: Partial<Driver>): Observable<Driver | undefined> {
    let updated: Driver | undefined;
    this._drivers.update(drivers => drivers.map(d => {
      if (d.id === id) { updated = { ...d, ...updates }; return updated; }
      return d;
    }));
    return of(updated).pipe(delay(200));
  }

  updateStatus(id: string, status: DriverStatus): Observable<Driver | undefined> {
    return this.updateDriver(id, { status });
  }
}
