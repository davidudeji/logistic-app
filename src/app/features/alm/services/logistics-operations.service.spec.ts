import { beforeEach, describe, expect, it } from 'vitest';
import { LogisticsOperationsService } from './logistics-operations.service';

describe('LogisticsOperationsService', () => {
  let service: LogisticsOperationsService;

  beforeEach(() => {
    service = new LogisticsOperationsService();
  });

  it('holds an unconfirmed order from dispatch', () => {
    service.setCashCap(40000);
    expect(() => service.assignOrder('ORD-1003', 'DRV-003')).toThrow(/confirmation is required/);
    expect(service.orders().find(order => order.id === 'ORD-1003')?.status).toBe('AWAITING_CONFIRMATION');
  });

  it('allows dispatch after receiver confirmation', () => {
    service.setCashCap(40000);
    service.confirmReceiver('ORD-1003');
    service.assignOrder('ORD-1003', 'DRV-003');
    expect(service.orders().find(order => order.id === 'ORD-1003')?.status).toBe('ASSIGNED');
  });

  it('blocks riders at their cap and allows them after matched remittance', () => {
    service.setCashCap(12500);
    service.assignOrder('ORD-1005', 'DRV-003');
    service.completeDelivery('ORD-1005', '5630');
    service.setCashCap(12500);
    expect(service.balanceFor('DRV-003')).toBe(12500);
    expect(() => service.assignOrder('ORD-1004', 'DRV-003')).toThrow(/cash cap/);

    service.recordRemittance('DRV-003', 5000);
    expect(service.balanceFor('DRV-003')).toBe(7500);
    expect(service.ledger().at(-1)?.type).toBe('REMITTANCE_MATCHED');
    expect(service.ledger().at(-1)?.orderId).toBe('ORD-1005');
  });

  it('does not create rider debt when a transfer-paid order is completed', () => {
    service.setCashCap(40000);
    const balanceBefore = service.balanceFor('DRV-003');
    service.assignOrder('ORD-1004', 'DRV-003');
    service.completeDelivery('ORD-1004', '8420');
    expect(service.balanceFor('DRV-003')).toBe(balanceBefore);
    expect(service.ledger().some(entry => entry.orderId === 'ORD-1004')).toBe(false);
  });

  it('adds one COD debt when delivery completes and prevents duplicate completion', () => {
    service.setCashCap(40000);
    service.assignOrder('ORD-1005', 'DRV-003');
    service.completeDelivery('ORD-1005', '5630');
    expect(service.balanceFor('DRV-003')).toBe(12500);
    expect(() => service.completeDelivery('ORD-1005', '5630')).toThrow(/already been used/);
    expect(service.ledger().filter(entry => entry.orderId === 'ORD-1005')).toHaveLength(1);
  });

  it('locks delivery after five wrong codes', () => {
    service.setCashCap(40000);
    service.assignOrder('ORD-1004', 'DRV-003');
    for (let attempt = 0; attempt < 4; attempt++) {
      expect(() => service.completeDelivery('ORD-1004', '0000')).toThrow(/incorrect/);
    }
    expect(() => service.completeDelivery('ORD-1004', '0000')).toThrow(/locked/);
    expect(() => service.completeDelivery('ORD-1004', '8420')).toThrow(/locked/);
  });

  it('requires a company cash cap before dispatch', () => {
    expect(() => service.assignOrder('ORD-1005', 'DRV-003')).toThrow(/cash cap before dispatching/);
    expect(service.riderBalances().find(entry => entry.rider.id === 'DRV-003')?.eligible).toBe(false);
  });

  it('uses a rider-specific cap override and falls back to the company cap', () => {
    service.setCashCap(40000);
    service.setRiderCap('DRV-003', 10000);
    expect(service.capFor('DRV-003')).toBe(10000);
    expect(service.capFor('DRV-001')).toBe(40000);
    service.assignOrder('ORD-1005', 'DRV-003');
    service.completeDelivery('ORD-1005', '5630');
    expect(() => service.assignOrder('ORD-1004', 'DRV-003')).toThrow(/cash cap/);
    service.setRiderCap('DRV-003', null);
    expect(service.capFor('DRV-003')).toBe(40000);
  });
});