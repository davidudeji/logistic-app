import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { DeliveryException } from '../../shared/models';
import { MOCK_EXCEPTIONS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class ExceptionService {
  private readonly _exceptions = signal<DeliveryException[]>([...MOCK_EXCEPTIONS]);

  readonly exceptions = this._exceptions.asReadonly();

  getExceptions(): Observable<DeliveryException[]> {
    return of(this._exceptions()).pipe(delay(200));
  }

  getOpenExceptions(): DeliveryException[] {
    return this._exceptions().filter(e => e.status !== 'RESOLVED');
  }

  getCriticalExceptions(): DeliveryException[] {
    return this._exceptions().filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH');
  }

  createException(exc: Omit<DeliveryException, 'id' | 'createdAt'>): Observable<DeliveryException> {
    const newExc: DeliveryException = {
      ...exc,
      id: `EXC-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this._exceptions.update(list => [newExc, ...list]);
    return of(newExc).pipe(delay(200));
  }

  acknowledge(id: string, assignedTo?: string): Observable<DeliveryException | undefined> {
    return this.updateException(id, { status: 'ACKNOWLEDGED', assignedTo });
  }

  resolve(id: string): Observable<DeliveryException | undefined> {
    return this.updateException(id, { status: 'RESOLVED', resolvedAt: new Date().toISOString() });
  }

  private updateException(id: string, updates: Partial<DeliveryException>): Observable<DeliveryException | undefined> {
    let updated: DeliveryException | undefined;
    this._exceptions.update(list => list.map(e => {
      if (e.id === id) { updated = { ...e, ...updates }; return updated; }
      return e;
    }));
    return of(updated).pipe(delay(150));
  }
}
