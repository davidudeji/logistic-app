import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Carrier } from '../../shared/models';
import { MOCK_CARRIERS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class CarrierService {
  private readonly _carriers = signal<Carrier[]>([...MOCK_CARRIERS]);

  readonly carriers = this._carriers.asReadonly();

  getCarriers(): Observable<Carrier[]> {
    return of(this._carriers()).pipe(delay(200));
  }

  getCarrier(id: string): Observable<Carrier | undefined> {
    return of(this._carriers().find(c => c.id === id)).pipe(delay(150));
  }
}
