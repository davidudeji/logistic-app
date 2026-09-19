import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { orderStatusBadge, orderStatusLabel } from '../../shared/utils/status.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <a routerLink="/orders" class="btn btn-sm btn-secondary">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Orders
        </a>
        <div class="header-title-group" style="margin-left:8px;">
          <h1 class="header-title">{{ order()?.id }}</h1>
          <span class="header-subtitle">Order Detail</span>
        </div>
      </div>
      @if (order()) {
        <div class="header-right">
          <span class="badge" [ngClass]="orderStatusBadge(order()!.status)">
            {{ orderStatusLabel(order()!.status) }}
          </span>
        </div>
      }
    </header>
    <main class="page-container">
      @if (order(); as o) {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="panel">
            <div class="panel-header"><h2 class="panel-title">Order Information</h2></div>
            <div class="panel-body">
              <div style="display:grid;gap:12px;">
                <div><div class="form-label">Customer</div><div style="font-weight:600;">{{ o.customerName }}</div></div>
                <div><div class="form-label">Priority</div><div>{{ o.priority }}</div></div>
                <div><div class="form-label">Pickup</div><div>{{ o.pickupAddress.formattedAddress }}</div></div>
                <div><div class="form-label">Destination</div><div>{{ o.deliveryAddress.formattedAddress }}</div></div>
                @if (o.deliveryWindow) {
                  <div><div class="form-label">Delivery Window</div>
                    <div>{{ o.deliveryWindow.start | date:'d MMM, HH:mm' }} – {{ o.deliveryWindow.end | date:'HH:mm' }}</div>
                  </div>
                }
                <div><div class="form-label">Created</div><div>{{ o.createdAt | date:'d MMM yyyy, HH:mm' }}</div></div>
              </div>
            </div>
          </div>
          <div class="panel">
            <div class="panel-header"><h2 class="panel-title">Packages</h2></div>
            <div class="panel-body">
              @for (pkg of o.packages; track pkg.id) {
                <div style="padding:8px 0;border-bottom:1px solid var(--border-subtle);">
                  <div style="font-weight:600;font-size:13px;">{{ pkg.description ?? 'Package' }}</div>
                  <div style="font-size:12px;color:var(--text-muted);">{{ pkg.weight }} kg</div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <div class="state-container"><div class="spinner"></div><div class="state-title">Loading order...</div></div>
      }
    </main>
  `
})
export class OrderDetailComponent {
  private route        = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  readonly orderStatusBadge = orderStatusBadge;
  readonly orderStatusLabel = orderStatusLabel;

  readonly order = toSignal(
    this.route.paramMap.pipe(
      switchMap(params => this.orderService.getOrder(params.get('id') ?? ''))
    )
  );
}
