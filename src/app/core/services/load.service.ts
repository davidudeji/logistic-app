import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Load, LoadStatus } from '../../shared/models';
import { MOCK_LOADS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class LoadService {
  private readonly _loads = signal<Load[]>([...MOCK_LOADS]);

  readonly loads = this._loads.asReadonly();

  getLoads(): Observable<Load[]> {
    return of(this._loads()).pipe(delay(200));
  }

  getLoad(id: string): Observable<Load | undefined> {
    return of(this._loads().find(l => l.id === id)).pipe(delay(150));
  }

  createLoad(load: Omit<Load, 'id' | 'reference' | 'createdAt' | 'updatedAt'>): Observable<Load> {
    const id = `LD-${1000 + this._loads().length + 1}`;
    const newLoad: Load = {
      ...load,
      id,
      reference: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._loads.update(loads => [...loads, newLoad]);
    return of(newLoad).pipe(delay(300));
  }

  updateLoad(id: string, updates: Partial<Load>): Observable<Load | undefined> {
    let updated: Load | undefined;
    this._loads.update(loads => loads.map(l => {
      if (l.id === id) {
        updated = { ...l, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return l;
    }));
    return of(updated).pipe(delay(200));
  }

  dispatchLoad(id: string): Observable<Load | undefined> {
    return this.updateLoad(id, { status: 'DISPATCHED' });
  }

  cancelLoad(id: string): Observable<Load | undefined> {
    return this.updateLoad(id, { status: 'CANCELLED' });
  }

  getActiveLoads(): Load[] {
    return this._loads().filter(l => l.status === 'IN_TRANSIT' || l.status === 'DISPATCHED');
  }
}
