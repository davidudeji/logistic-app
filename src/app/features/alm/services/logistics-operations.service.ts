import { Injectable, computed, signal } from '@angular/core';
import { MOCK_DRIVERS } from '../../../core/mock/mock-data';
import { Driver } from '../../../shared/models';

export type ReceiverStatus = 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
export type LogisticsOrderStatus = 'AWAITING_CONFIRMATION' | 'CONFIRMED' | 'ASSIGNED' | 'DELIVERED';
export type CollectionMethod = 'COD' | 'TRANSFER';
export type LedgerEntryType = 'COD_COLLECTED' | 'REMITTANCE_MATCHED';

export interface LogisticsOrder {
  id: string;
  receiverName: string;
  receiverPhone: string;
  destination: string;
  amountDue: number;
  receiverStatus: ReceiverStatus;
  status: LogisticsOrderStatus;
  paymentMethod: CollectionMethod;
  transferPaid: boolean;
  deliveryCode: string;
  codeAttempts: number;
  codeUsed: boolean;
  riderId?: string;
}

export interface CashLedgerEntry {
  id: string;
  riderId: string;
  orderId: string;
  type: LedgerEntryType;
  amount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class LogisticsOperationsService {
  readonly cashCap = signal(0);
  readonly riderCaps = signal<Record<string, number>>({});
  readonly orders = signal<LogisticsOrder[]>([
    { id: 'ORD-1001', receiverName: 'Chika Nwosu', receiverPhone: '+234 803 120 4001', destination: 'Victoria Island, Lagos', amountDue: 18500, receiverStatus: 'CONFIRMED', status: 'DELIVERED', paymentMethod: 'COD', transferPaid: false, deliveryCode: '4821', codeAttempts: 0, codeUsed: true, riderId: 'DRV-001' },
    { id: 'ORD-1002', receiverName: 'Tunde Balogun', receiverPhone: '+234 803 120 4002', destination: 'Wuse 2, Abuja', amountDue: 32000, receiverStatus: 'CONFIRMED', status: 'ASSIGNED', paymentMethod: 'COD', transferPaid: false, deliveryCode: '7354', codeAttempts: 0, codeUsed: false, riderId: 'DRV-002' },
    { id: 'ORD-1003', receiverName: 'Aisha Musa', receiverPhone: '+234 803 120 4003', destination: 'Kofar Wambai, Kano', amountDue: 27500, receiverStatus: 'AWAITING_CONFIRMATION', status: 'AWAITING_CONFIRMATION', paymentMethod: 'COD', transferPaid: false, deliveryCode: '1916', codeAttempts: 0, codeUsed: false },
    { id: 'ORD-1004', receiverName: 'Chinedu Okeke', receiverPhone: '+234 803 120 4004', destination: 'Trans Amadi, Port Harcourt', amountDue: 46000, receiverStatus: 'CONFIRMED', status: 'CONFIRMED', paymentMethod: 'TRANSFER', transferPaid: true, deliveryCode: '8420', codeAttempts: 0, codeUsed: false },
    { id: 'ORD-1005', receiverName: 'Mariam Eze', receiverPhone: '+234 803 120 4005', destination: 'GRA, Benin City', amountDue: 12500, receiverStatus: 'CONFIRMED', status: 'CONFIRMED', paymentMethod: 'COD', transferPaid: false, deliveryCode: '5630', codeAttempts: 0, codeUsed: false },
    { id: 'ORD-1006', receiverName: 'Sani Ibrahim', receiverPhone: '+234 803 120 4006', destination: 'Ali Akilu Road, Kaduna', amountDue: 54000, receiverStatus: 'AWAITING_CONFIRMATION', status: 'AWAITING_CONFIRMATION', paymentMethod: 'COD', transferPaid: false, deliveryCode: '2087', codeAttempts: 0, codeUsed: false },
  ]);
  readonly ledger = signal<CashLedgerEntry[]>([
    { id: 'LED-001', riderId: 'DRV-001', orderId: 'ORD-1001', type: 'COD_COLLECTED', amount: 18500, createdAt: '2026-10-31T12:15:00.000Z' },
    { id: 'LED-002', riderId: 'DRV-001', orderId: 'ORD-1001', type: 'REMITTANCE_MATCHED', amount: 5000, createdAt: '2026-10-31T16:30:00.000Z' },
  ]);
  readonly riders: Driver[] = MOCK_DRIVERS;
  readonly riderBalances = computed(() => this.riders.map(rider => ({
    rider,
    balance: this.balanceFor(rider.id),
    cap: this.capFor(rider.id),
    eligible: this.canAssignTo(rider.id),
  })));

  balanceFor(riderId: string): number {
    return this.ledger()
      .filter(entry => entry.riderId === riderId)
      .reduce((balance, entry) => balance + (entry.type === 'COD_COLLECTED' ? entry.amount : -entry.amount), 0);
  }

  confirmReceiver(orderId: string): void {
    this.updateOrder(orderId, order => {
      this.require(order.receiverStatus === 'AWAITING_CONFIRMATION', 'Order is not awaiting receiver confirmation.');
      return { ...order, receiverStatus: 'CONFIRMED', status: 'CONFIRMED' };
    });
  }

  markTransferPaid(orderId: string): void {
    this.updateOrder(orderId, order => {
      this.require(order.receiverStatus === 'CONFIRMED', 'Receiver must confirm before payment.');
      this.require(order.status === 'CONFIRMED', 'Payment must be recorded before assignment.');
      return { ...order, paymentMethod: 'TRANSFER', transferPaid: true };
    });
  }

  assignOrder(orderId: string, riderId: string): void {
    const order = this.orderById(orderId);
    this.require(order.receiverStatus === 'CONFIRMED', 'Receiver confirmation is required before dispatch.');
    this.require(order.status === 'CONFIRMED', 'Only confirmed, unassigned orders can be dispatched.');
    const rider = this.riders.find(candidate => candidate.id === riderId);
    this.require(Boolean(rider) && rider?.status === 'AVAILABLE', 'Rider is not available.');
    this.require(this.capFor(riderId) > 0, 'Set a company or rider cash cap before dispatching.');
    this.require(this.balanceFor(riderId) < this.capFor(riderId), 'Rider has reached the cash cap.');
    this.require(!this.orders().some(candidate => candidate.status === 'ASSIGNED' && candidate.riderId === riderId), 'Rider already has an active assignment.');
    this.orders.update(orders => orders.map(candidate => candidate.id === orderId
      ? { ...candidate, status: 'ASSIGNED', riderId }
      : candidate));
  }

  completeDelivery(orderId: string, code: string): void {
    const order = this.orderById(orderId);
    this.require(!order.codeUsed, 'Delivery code has already been used.');
    this.require(order.status === 'ASSIGNED' && Boolean(order.riderId), 'Order must be assigned before completion.');
    this.require(order.codeAttempts < 5, 'Delivery code attempts are locked.');
    if (!/^\d{4}$/.test(code) || code !== order.deliveryCode) {
      this.orders.update(orders => orders.map(candidate => candidate.id === orderId
        ? { ...candidate, codeAttempts: candidate.codeAttempts + 1 }
        : candidate));
      throw new Error(order.codeAttempts + 1 >= 5 ? 'Delivery code attempts are locked.' : 'Delivery code is incorrect.');
    }
    this.orders.update(orders => orders.map(candidate => candidate.id === orderId
      ? { ...candidate, status: 'DELIVERED', codeUsed: true }
      : candidate));
    if (order.paymentMethod === 'COD' && !order.transferPaid && order.amountDue > 0) {
      this.appendLedgerEntry(order.riderId!, orderId, 'COD_COLLECTED', order.amountDue);
    }
  }

  recordRemittance(riderId: string, amount: number): void {
    this.require(Number.isInteger(amount) && amount > 0, 'Remittance must be a positive whole-naira amount.');
    this.require(amount <= this.balanceFor(riderId), 'Remittance cannot exceed the rider cash balance.');

    let remaining = amount;
    const collections = this.ledger()
      .filter(entry => entry.riderId === riderId && entry.type === 'COD_COLLECTED')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const matched = new Map<string, number>();
    for (const collection of collections) {
      const alreadyMatched = this.ledger()
        .filter(entry => entry.riderId === riderId && entry.orderId === collection.orderId && entry.type === 'REMITTANCE_MATCHED')
        .reduce((total, entry) => total + entry.amount, 0);
      const available = collection.amount - alreadyMatched;
      if (available <= 0) continue;
      const matchAmount = Math.min(available, remaining);
      matched.set(collection.orderId, (matched.get(collection.orderId) ?? 0) + matchAmount);
      remaining -= matchAmount;
      if (remaining === 0) break;
    }

    const timestamp = new Date().toISOString();
    const entries = Array.from(matched, ([orderId, matchedAmount]) => ({
      id: `LED-${crypto.randomUUID()}`,
      riderId,
      orderId,
      type: 'REMITTANCE_MATCHED' as const,
      amount: matchedAmount,
      createdAt: timestamp,
    }));
    this.ledger.update(current => [...current, ...entries]);
  }

  setCashCap(amount: number): void {
    this.require(Number.isInteger(amount) && amount > 0, 'Cash cap must be a positive whole-naira amount.');
    this.cashCap.set(amount);
  }

  capFor(riderId: string): number {
    return this.riderCaps()[riderId] ?? this.cashCap();
  }

  setRiderCap(riderId: string, amount: number | null): void {
    this.require(this.riders.some(rider => rider.id === riderId), 'Rider was not found.');
    if (amount === null) {
      this.riderCaps.update(caps => {
        const next = { ...caps };
        delete next[riderId];
        return next;
      });
      return;
    }
    this.require(Number.isInteger(amount) && amount > 0, 'Rider cash cap must be a positive whole-naira amount.');
    this.riderCaps.update(caps => ({ ...caps, [riderId]: amount }));
  }

  private orderById(orderId: string): LogisticsOrder {
    const order = this.orders().find(candidate => candidate.id === orderId);
    this.require(Boolean(order), `Order ${orderId} was not found.`);
    return order!;
  }

  private canAssignTo(riderId: string): boolean {
    const rider = this.riders.find(candidate => candidate.id === riderId);
    const cap = this.capFor(riderId);
    return Boolean(rider && rider.status === 'AVAILABLE' && cap > 0 &&
      this.balanceFor(riderId) < cap &&
      !this.orders().some(order => order.status === 'ASSIGNED' && order.riderId === riderId));
  }

  private updateOrder(orderId: string, update: (order: LogisticsOrder) => LogisticsOrder): void {
    const order = this.orderById(orderId);
    const updated = update(order);
    this.orders.update(orders => orders.map(candidate => candidate.id === orderId ? updated : candidate));
  }

  private appendLedgerEntry(riderId: string, orderId: string, type: LedgerEntryType, amount: number): void {
    this.ledger.update(entries => [...entries, {
      id: `LED-${crypto.randomUUID()}`,
      riderId,
      orderId,
      type,
      amount,
      createdAt: new Date().toISOString(),
    }]);
  }

  private require(condition: boolean, message: string): asserts condition {
    if (!condition) throw new Error(message);
  }
}