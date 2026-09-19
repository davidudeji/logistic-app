import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Order, OrderStatus } from '../../shared/models';
import { MOCK_ORDERS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly _orders = signal<Order[]>([...MOCK_ORDERS]);

  readonly orders = this._orders.asReadonly();

  getOrders(): Observable<Order[]> {
    return of(this._orders()).pipe(delay(200));
  }

  getOrder(id: string): Observable<Order | undefined> {
    return of(this._orders().find(o => o.id === id)).pipe(delay(150));
  }

  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Observable<Order> {
    const newOrder: Order = {
      ...order,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this._orders.update(orders => [...orders, newOrder]);
    return of(newOrder).pipe(delay(300));
  }

  updateOrder(id: string, updates: Partial<Order>): Observable<Order | undefined> {
    let updated: Order | undefined;
    this._orders.update(orders => orders.map(o => {
      if (o.id === id) {
        updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return o;
    }));
    return of(updated).pipe(delay(200));
  }

  updateStatus(id: string, status: OrderStatus): Observable<Order | undefined> {
    return this.updateOrder(id, { status });
  }

  cancelOrder(id: string): Observable<Order | undefined> {
    return this.updateOrder(id, { status: 'CANCELLED' });
  }
}
