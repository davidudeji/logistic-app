import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { Order, OrderStatus } from '../../shared/models';
import { orderStatusBadge, orderStatusLabel } from '../../shared/utils/status.utils';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Orders</h1>
          <span class="header-subtitle">Manage and track customer orders</span>
        </div>
        <div class="search-bar">
          <span class="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input id="orderSearch" type="text" class="search-input" placeholder="Search orders..."
                 [(ngModel)]="searchQuery" />
        </div>
      </div>
      <div class="header-right">
        <select class="form-select" style="height:34px;width:160px;" [(ngModel)]="statusFilter">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="READY">Ready</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button class="btn btn-primary" id="createOrderBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Order
        </button>
      </div>
    </header>

    <main class="page-container">
      <div class="panel">
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Priority</th>
                <th>Pickup</th>
                <th>Destination</th>
                <th>Delivery Window</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (order of filteredOrders(); track order.id) {
                <tr>
                  <td><span class="order-id data-mono" style="color:var(--brand);font-weight:600;">{{ order.id }}</span></td>
                  <td style="font-weight:500;">{{ order.customerName }}</td>
                  <td><span class="badge" [ngClass]="priorityBadge(order.priority)">{{ order.priority }}</span></td>
                  <td class="muted">{{ order.pickupAddress.city }}</td>
                  <td class="muted">{{ order.deliveryAddress.city }}</td>
                  <td class="muted" style="font-size:12px;">
                    @if (order.deliveryWindow) {
                      {{ order.deliveryWindow.start | date:'HH:mm' }} – {{ order.deliveryWindow.end | date:'HH:mm' }}
                    } @else { — }
                  </td>
                  <td><span class="badge" [ngClass]="orderStatusBadge(order.status)">{{ orderStatusLabel(order.status) }}</span></td>
                  <td>
                    <a [routerLink]="['/orders', order.id]" class="btn btn-xs btn-secondary">View</a>
                  </td>
                </tr>
              }
              @if (filteredOrders().length === 0) {
                <tr><td colspan="8">
                  <div class="state-container">
                    <div class="state-title">No orders found</div>
                    <div class="state-desc">Try adjusting your search or filters.</div>
                  </div>
                </td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  `
})
export class OrdersListComponent {
  private orderService = inject(OrderService);
  readonly searchQuery  = signal('');
  readonly statusFilter = signal('');

  readonly orderStatusBadge = orderStatusBadge;
  readonly orderStatusLabel = orderStatusLabel;

  filteredOrders = computed(() => {
    let orders = this.orderService.orders();
    const q = this.searchQuery();
    const s = this.statusFilter();
    if (q) {
      const ql = q.toLowerCase();
      orders = orders.filter(o =>
        o.id.toLowerCase().includes(ql) ||
        o.customerName.toLowerCase().includes(ql) ||
        o.pickupAddress.city.toLowerCase().includes(ql) ||
        o.deliveryAddress.city.toLowerCase().includes(ql)
      );
    }
    if (s) {
      orders = orders.filter(o => o.status === s as any);
    }
    return orders;
  });

  priorityBadge(p: string): string {
    const m: Record<string, string> = {
      LOW: 'badge-neutral', NORMAL: 'badge-info', HIGH: 'badge-warning', URGENT: 'badge-error'
    };
    return m[p] ?? 'badge-neutral';
  }
}
