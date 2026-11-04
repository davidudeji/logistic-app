import { InvoiceLine } from './invoice.model';
import { computeTotals, formatMinorAsMajor, parseMajorToMinor } from './invoice-totals';

function line(
  quantity: string,
  unitPriceMinor: string,
  taxCategory: InvoiceLine['taxCategory'] = 'standard',
  taxRateBps = 750,
): InvoiceLine {
  return {
    id: 'line-1',
    description: 'Freight service',
    quantity,
    unitPriceMinor,
    taxCategory,
    taxRateBps,
  };
}

describe('invoice totals', () => {
  it('calculates VAT from decimal quantities using integer minor units', () => {
    expect(computeTotals([line('1.5', '10000')], true, false)).toEqual({
      subtotalMinor: '15000',
      taxMinor: '1125',
      totalMinor: '16125',
      lines: [{ subtotalMinor: '15000', taxMinor: '1125', totalMinor: '16125' }],
    });
  });

  it('rounds tax half-up per line', () => {
    const totals = computeTotals([
      line('1', '1', 'standard', 5000),
      line('1', '1', 'standard', 5000),
    ], true, false);

    expect(totals.taxMinor).toBe('2');
    expect(totals.totalMinor).toBe('4');
  });

  it('extracts VAT from tax-inclusive prices without changing the gross total', () => {
    expect(computeTotals([line('1', '10750')], true, true)).toMatchObject({
      subtotalMinor: '10000',
      taxMinor: '750',
      totalMinor: '10750',
    });
  });

  it('does not charge VAT for unregistered tenants or non-standard categories', () => {
    const lines = [
      line('1', '10000', 'standard'),
      line('1', '20000', 'zero-rated'),
      line('1', '30000', 'exempt'),
    ];

    expect(computeTotals(lines, false, false).taxMinor).toBe('0');
    expect(computeTotals(lines, true, false)).toMatchObject({
      subtotalMinor: '60000',
      taxMinor: '750',
      totalMinor: '60750',
    });
  });

  it('converts displayed currency values to and from integer minor units', () => {
    expect(parseMajorToMinor('1234.5')).toBe('123450');
    expect(parseMajorToMinor('.5')).toBe('50');
    expect(formatMinorAsMajor('123450')).toBe('1234.50');
    expect(parseMajorToMinor('')).toBe('0');
    expect(() => parseMajorToMinor('-1')).toThrow();
  });

  it('rejects invalid tax rates and quantities instead of rounding invalid input', () => {
    expect(() => computeTotals([line('1.1234567', '10000')], true, false)).toThrow();
    expect(() => computeTotals([line('1', '10000', 'standard', -1)], true, false)).toThrow();
  });
});
