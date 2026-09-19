import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Delivery, DeliveryFailureReason } from '../../shared/models';
import { MOCK_DELIVERIES } from '../mock/mock-data';
import { ExceptionService } from './exception.service';

@Injectable({ providedIn: 'root' })
export class DeliveryService {
  private readonly _deliveries = signal<Delivery[]>([...MOCK_DELIVERIES]);

  readonly deliveries = this._deliveries.asReadonly();

  constructor(private exceptionService: ExceptionService) {}

  getDeliveries(): Observable<Delivery[]> {
    return of(this._deliveries()).pipe(delay(200));
  }

  getDelivery(id: string): Observable<Delivery | undefined> {
    return of(this._deliveries().find(d => d.id === id)).pipe(delay(150));
  }

  completeDelivery(id: string, recipientName?: string): Observable<Delivery | undefined> {
    return this.updateDelivery(id, {
      status: 'DELIVERED',
      completedAt: new Date().toISOString(),
      recipientName,
    });
  }

  /**
   * Mark delivery as failed and auto-create an exception.
   */
  failDelivery(
    id: string,
    reason: DeliveryFailureReason,
    notes?: string
  ): Observable<Delivery | undefined> {
    const delivery = this._deliveries().find(d => d.id === id);
    if (delivery) {
      // Auto-create exception
      this.exceptionService.createException({
        type: 'FAILED_ATTEMPT',
        severity: 'HIGH',
        orderId: delivery.orderId,
        description: `Failed delivery for order ${delivery.orderId}. Reason: ${reason}. Notes: ${notes ?? 'None'}`,
        status: 'OPEN',
      }).subscribe();
    }
    return this.updateDelivery(id, {
      status: 'FAILED',
      attemptedAt: new Date().toISOString(),
      failureReason: reason,
      failureNotes: notes,
    });
  }

  private updateDelivery(id: string, updates: Partial<Delivery>): Observable<Delivery | undefined> {
    let updated: Delivery | undefined;
    this._deliveries.update(list => list.map(d => {
      if (d.id === id) { updated = { ...d, ...updates }; return updated; }
      return d;
    }));
    return of(updated).pipe(delay(200));
  }
}
