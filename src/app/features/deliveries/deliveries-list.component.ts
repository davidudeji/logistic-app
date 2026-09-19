import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { OrderService } from '../../core/services/order.service';
import { deliveryStatusBadge } from '../../shared/utils/status.utils';

function deliveryStatusLabel(s: string): string {
  const m: Record<string, string> = {
    PENDING: 'Pending', OUT_FOR_DELIVERY: 'Out for Delivery',
    ARRIVED: 'Arrived', DELIVERED: 'Delivered', FAILED: 'Failed',
  };
  return m[s] ?? s;
}

@Component({
  selector: 'app-deliveries-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Deliveries</h1>
          <span class="header-subtitle">Track all delivery attempts</span>
        </div>
      </div>
    </header>
    <main class="page-container">
      <div class="panel">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              @for (del of deliveries(); track del.id) {
                <tr>
                  <td><span class="data-mono" style="font-size:12px;">{{ del.id }}</span></td>
                  <td>
                    <a [routerLink]="['/orders', del.orderId]" class="data-mono" style="color:var(--brand);font-weight:600;">
                      {{ del.orderId }}
                    </a>
                  </td>
                  <td class="muted">{{ customerName(del.orderId) }}</td>
                  <td class="muted">{{ destinationCity(del.orderId) }}</td>
                  <td><span class="badge" [ngClass]="deliveryStatusBadge(del.status)">{{ statusLabel(del.status) }}</span></td>
                  <td class="muted" style="font-size:12px;">
                    {{ del.completedAt ? (del.completedAt | date:'d MMM, HH:mm') : '—' }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `
})
export class DeliveriesListComponent {
  private deliveryService = inject(DeliveryService);
  private orderService    = inject(OrderService);

  readonly deliveryStatusBadge = deliveryStatusBadge;
  readonly statusLabel         = deliveryStatusLabel;

  readonly deliveries = this.deliveryService.deliveries;

  customerName(orderId: string): string {
    return this.orderService.orders().find(o => o.id === orderId)?.customerName ?? '—';
  }

  destinationCity(orderId: string): string {
    return this.orderService.orders().find(o => o.id === orderId)?.deliveryAddress.city ?? '—';
  }
}
