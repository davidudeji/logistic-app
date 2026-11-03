import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LogisticsOperationsService } from '../../services/logistics-operations.service';

@Component({
  standalone: true,
  imports: [CommonModule, CurrencyPipe, RouterLink],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">COD &amp; receiver readiness</h1>
          <span class="header-subtitle">Confirm before dispatch, track rider cash, and match remittances</span>
        </div>
      </div>
    </header>

    <main class="page-container">
      <div class="metric-strip">
        <div><span class="metric-label">Awaiting confirmation</span><strong>{{ awaitingCount() }}</strong></div>
        <div><span class="metric-label">Cash in the field</span><strong>{{ cashInField() | currency:'NGN':'symbol':'1.0-0' }}</strong></div>
        <div><span class="metric-label">Riders at cash cap</span><strong>{{ blockedRiderCount() }}</strong></div>
      </div>

      @if (message()) {
        <div class="feedback" role="status">{{ message() }}</div>
      }

      <div class="operations-layout">
        <section class="panel orders-panel" aria-labelledby="orders-heading">
          <div class="panel-header">
            <div class="panel-title-group">
              <h2 class="panel-title" id="orders-heading">Order readiness</h2>
              <span class="panel-count">{{ operations.orders().length }}</span>
            </div>
          </div>
          <div class="order-list">
            @for (order of operations.orders(); track order.id) {
              <article class="order-row">
                <div class="order-main">
                  <div class="order-heading">
                    <a class="data-mono order-id" [routerLink]="['/orders', order.id]">{{ order.id }}</a>
                    <span class="badge" [ngClass]="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
                  </div>
                  <strong>{{ order.receiverName }}</strong>
                  <span class="muted">{{ order.destination }} · {{ order.receiverPhone }}</span>
                </div>
                <div class="order-payment">
                  <strong>{{ order.amountDue | currency:'NGN':'symbol':'1.0-0' }}</strong>
                  <span class="muted">{{ order.transferPaid ? 'Transfer paid' : order.paymentMethod }}</span>
                  @if (order.riderId) {
                    <span class="muted">{{ riderName(order.riderId) }}</span>
                  }
                </div>
                <div class="order-actions">
                  @if (order.status === 'AWAITING_CONFIRMATION') {
                    <button class="btn btn-secondary" type="button" (click)="run(() => operations.confirmReceiver(order.id), 'Receiver confirmation recorded')">Mark confirmed</button>
                  } @else if (order.status === 'CONFIRMED') {
                    @if (order.paymentMethod === 'COD' && !order.transferPaid) {
                      <button class="btn btn-secondary" type="button" (click)="run(() => operations.markTransferPaid(order.id), 'Transfer recorded; order no longer counts as COD')">Record transfer</button>
                    }
                    <select class="rider-select" aria-label="Available rider" [value]="selectedRider(order.id)" (change)="selectRider(order.id, $event)">
                      @for (rider of eligibleRiders(); track rider.id) {
                        <option [value]="rider.id">{{ rider.name }}</option>
                      }
                      @if (eligibleRiders().length === 0) {
                        <option value="">No eligible riders</option>
                      }
                    </select>
                    <button class="btn btn-primary" type="button" [disabled]="!selectedRider(order.id)" (click)="assign(order.id)">Assign</button>
                  } @else if (order.status === 'ASSIGNED') {
                    <label class="code-field">
                      <span class="sr-only">Receiver delivery code for {{ order.id }}</span>
                      <input inputmode="numeric" autocomplete="one-time-code" maxlength="4" placeholder="4-digit code" [value]="codeDrafts()[order.id] ?? ''" (input)="setCode(order.id, $event)" />
                    </label>
                    <button class="btn btn-primary" type="button" (click)="complete(order.id)">Verify &amp; deliver</button>
                  } @else {
                    <span class="delivered-label">Code verified</span>
                  }
                </div>
              </article>
            }
          </div>
        </section>

        <aside class="panel cash-panel" aria-labelledby="cash-heading">
          <div class="panel-header">
            <div class="panel-title-group">
              <h2 class="panel-title" id="cash-heading">Rider cash</h2>
            </div>
            <label class="cap-control">
              <span>Company cap</span>
              <input type="number" min="1" step="1000" [value]="operations.cashCap()" (change)="setCap($event)" />
            </label>
          </div>
          @if (operations.cashCap() === 0) {
            <p class="cap-note">Set the company cash cap or a rider-specific cap before assigning orders.</p>
          }
          <div class="rider-list">
            @for (entry of operations.riderBalances(); track entry.rider.id) {
              <div class="rider-row">
                <div class="rider-summary">
                  <strong>{{ entry.rider.name }}</strong>
                  <span class="muted">{{ entry.rider.status }} · {{ riderState(entry) }}</span>
                </div>
                <strong class="rider-balance">{{ entry.balance | currency:'NGN':'symbol':'1.0-0' }}</strong>
                <label class="rider-cap-control">
                  <span>Rider cap</span>
                  <input type="number" min="1" step="1000" [attr.aria-label]="'Cash cap for ' + entry.rider.name" [placeholder]="operations.cashCap() ? (operations.cashCap() | number) : 'Set cap'" [value]="operations.riderCaps()[entry.rider.id] ?? ''" (change)="setRiderCap(entry.rider.id, $event)" />
                </label>
                <div class="remittance-control">
                  <input type="number" min="1" step="500" inputmode="numeric" placeholder="Amount" [attr.aria-label]="'Remittance amount for ' + entry.rider.name" [value]="remittanceDrafts()[entry.rider.id] ?? ''" (input)="setRemittance(entry.rider.id, $event)" />
                  <button class="btn btn-secondary" type="button" [disabled]="entry.balance <= 0" (click)="remit(entry.rider.id)">Match</button>
                </div>
              </div>
            }
          </div>
          <div class="ledger-heading">
            <h3>Recent ledger</h3>
            <span class="muted">Append-only activity</span>
          </div>
          <div class="ledger-list">
            @for (entry of recentEntries(); track entry.id) {
              <div class="ledger-row">
                <span>{{ entry.type === 'COD_COLLECTED' ? 'COD collected' : 'Remittance matched' }}<small>{{ entry.orderId }} · {{ riderName(entry.riderId) }}</small></span>
                <strong>{{ entry.amount | currency:'NGN':'symbol':'1.0-0' }}</strong>
              </div>
            }
            @if (recentEntries().length === 0) {
              <p class="muted empty-ledger">No cash movements recorded.</p>
            }
          </div>
        </aside>
      </div>
    </main>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; min-width: 0; }
    .metric-strip { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-block: 1px solid var(--border, #e5e7eb); margin-bottom: 16px; }
    .metric-strip > div { display: grid; gap: 5px; padding: 14px 18px; border-right: 1px solid var(--border, #e5e7eb); }
    .metric-strip > div:last-child { border-right: 0; }
    .metric-label { color: var(--text-secondary, #64748b); font-size: 12px; }
    .metric-strip strong { font-size: 20px; font-variant-numeric: tabular-nums; }
    .operations-layout { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(300px, .85fr); gap: 16px; align-items: start; }
    .panel { min-width: 0; }
    .order-row { display: grid; grid-template-columns: minmax(180px, 1fr) 145px minmax(250px, auto); align-items: center; gap: 16px; padding: 14px 16px; border-top: 1px solid var(--border, #e5e7eb); }
    .order-main, .order-payment { display: grid; gap: 5px; min-width: 0; }
    .order-main > strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .order-heading { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .order-id { color: var(--brand, #2563eb); font-weight: 600; }
    .order-payment { justify-items: start; }
    .order-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
    .rider-select, .code-field input, .cap-control input, .remittance-control input { min-width: 0; height: 38px; border: 1px solid var(--border, #d1d5db); border-radius: 4px; background: white; padding: 0 9px; color: inherit; }
    .rider-select { max-width: 150px; }
    .code-field input { width: 110px; }
    .cash-panel .panel-header { align-items: center; gap: 12px; }
    .cap-control { display: flex; align-items: center; gap: 6px; color: var(--text-secondary, #64748b); font-size: 12px; }
    .cap-control input { width: 112px; }
    .cap-note { margin: 0; padding: 0 16px 10px; color: var(--text-secondary, #64748b); font-size: 12px; }
    .rider-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px 12px; padding: 13px 16px; border-top: 1px solid var(--border, #e5e7eb); }
    .rider-summary { display: grid; gap: 4px; min-width: 0; }
    .rider-summary .muted { font-size: 12px; }
    .rider-balance { align-self: center; }
    .rider-cap-control { grid-column: 1 / -1; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-secondary, #64748b); font-size: 12px; }
    .rider-cap-control input { width: 140px; height: 36px; border: 1px solid var(--border, #d1d5db); border-radius: 4px; background: white; padding: 0 9px; color: inherit; }
    .remittance-control { grid-column: 1 / -1; display: flex; gap: 8px; }
    .remittance-control input { flex: 1; }
    .ledger-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin: 14px 16px 0; padding-top: 12px; border-top: 1px solid var(--border, #e5e7eb); }
    .ledger-heading h3 { margin: 0; font-size: 14px; }
    .ledger-heading .muted { font-size: 11px; }
    .ledger-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 16px; border-top: 1px solid var(--border, #e5e7eb); font-size: 12px; }
    .ledger-row span { display: grid; gap: 3px; }
    .ledger-row small { color: var(--text-secondary, #64748b); }
    .empty-ledger { padding: 0 16px; font-size: 13px; }
    .feedback { margin-bottom: 12px; padding: 10px 12px; border-left: 3px solid var(--brand, #2563eb); background: #f5f8fc; color: var(--text-primary, #1f2937); font-size: 13px; }
    .delivered-label { color: #26734d; font-size: 12px; font-weight: 600; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
    @media (max-width: 1100px) { .operations-layout { grid-template-columns: 1fr; } }
    @media (max-width: 760px) {
      .metric-strip { grid-template-columns: 1fr; }
      .metric-strip > div { grid-template-columns: 1fr auto; align-items: center; padding: 10px 12px; border-right: 0; border-bottom: 1px solid var(--border, #e5e7eb); }
      .metric-strip > div:last-child { border-bottom: 0; }
      .order-row { grid-template-columns: minmax(0, 1fr) auto; gap: 10px; padding: 14px 12px; }
      .order-main { grid-column: 1 / -1; }
      .order-payment { align-self: start; }
      .order-actions { justify-content: flex-start; grid-column: 1 / -1; }
      .rider-row { padding-inline: 12px; }
      .ledger-row { padding-inline: 12px; }
      .cash-panel .panel-header { align-items: flex-start; flex-wrap: wrap; padding: 12px; }
    }
    @media (max-width: 420px) { .order-actions > * { flex: 1 1 100%; max-width: none; } }
  `],
})
export class LogisticsOperationsPageComponent {
  readonly operations = inject(LogisticsOperationsService);
  readonly message = signal('');
  readonly codeDrafts = signal<Record<string, string>>({});
  readonly riderSelection = signal<Record<string, string>>({});
  readonly remittanceDrafts = signal<Record<string, number>>({});
  readonly eligibleRiders = computed(() => this.operations.riderBalances().filter(entry => entry.eligible).map(entry => entry.rider));
  readonly awaitingCount = computed(() => this.operations.orders().filter(order => order.status === 'AWAITING_CONFIRMATION').length);
  readonly cashInField = computed(() => this.operations.riderBalances().reduce((sum, entry) => sum + entry.balance, 0));
  readonly blockedRiderCount = computed(() => this.operations.riderBalances().filter(entry => entry.cap > 0 && entry.balance >= entry.cap).length);
  readonly recentEntries = computed(() => [...this.operations.ledger()].reverse().slice(0, 5));

  riderState(entry: { rider: { id: string; status: string }; balance: number; cap: number; eligible: boolean }): string {
    if (entry.cap === 0) return 'Cash cap not set';
    if (entry.eligible) return 'Eligible';
    if (entry.balance >= entry.cap) return 'Cash cap reached';
    if (this.operations.orders().some(order => order.status === 'ASSIGNED' && order.riderId === entry.rider.id)) return 'Active assignment';
    return 'Unavailable';
  }

  statusLabel(status: string): string {
    return ({ AWAITING_CONFIRMATION: 'Awaiting confirmation', CONFIRMED: 'Confirmed', ASSIGNED: 'Assigned', DELIVERED: 'Delivered' } as Record<string, string>)[status] ?? status;
  }

  statusClass(status: string): string {
    return ({ AWAITING_CONFIRMATION: 'badge-warning', CONFIRMED: 'badge-info', ASSIGNED: 'badge-neutral', DELIVERED: 'badge-success' } as Record<string, string>)[status] ?? 'badge-neutral';
  }

  riderName(riderId: string): string {
    return this.operations.riders.find(rider => rider.id === riderId)?.name ?? riderId;
  }

  selectedRider(orderId: string): string {
    const saved = this.riderSelection()[orderId];
    return saved && this.eligibleRiders().some(rider => rider.id === saved) ? saved : this.eligibleRiders()[0]?.id ?? '';
  }

  selectRider(orderId: string, event: Event): void {
    this.riderSelection.update(selection => ({ ...selection, [orderId]: (event.target as HTMLSelectElement).value }));
  }

  setCode(orderId: string, event: Event): void {
    this.codeDrafts.update(codes => ({ ...codes, [orderId]: (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4) }));
  }

  setRemittance(riderId: string, event: Event): void {
    const amount = Number((event.target as HTMLInputElement).value);
    this.remittanceDrafts.update(drafts => ({ ...drafts, [riderId]: amount }));
  }

  setRiderCap(riderId: string, event: Event): void {
    const rawValue = (event.target as HTMLInputElement).value;
    this.run(() => this.operations.setRiderCap(riderId, rawValue ? Number(rawValue) : null), 'Rider cash cap updated');
  }

  setCap(event: Event): void {
    this.run(() => this.operations.setCashCap(Number((event.target as HTMLInputElement).value)), 'Company cash cap updated');
  }

  assign(orderId: string): void {
    this.run(() => this.operations.assignOrder(orderId, this.selectedRider(orderId)), 'Order assigned');
  }

  complete(orderId: string): void {
    this.run(() => this.operations.completeDelivery(orderId, this.codeDrafts()[orderId] ?? ''), 'Delivery code verified; order completed');
  }

  remit(riderId: string): void {
    this.run(() => this.operations.recordRemittance(riderId, this.remittanceDrafts()[riderId] ?? 0), 'Remittance matched to outstanding COD orders');
    this.remittanceDrafts.update(drafts => ({ ...drafts, [riderId]: 0 }));
  }

  run(action: () => void, successMessage: string): void {
    try {
      action();
      this.message.set(successMessage);
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Action could not be completed.');
    }
  }
}