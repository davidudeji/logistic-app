import { InvoiceDraft, InvoiceLine, InvoiceTotals } from './invoice.model';

const QUANTITY_SCALE = 1_000_000n;

function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error('The rounding denominator must be positive.');
  }
  return (numerator + denominator / 2n) / denominator;
}

function parseQuantity(value: string): bigint {
  const trimmed = value.trim();
  if (trimmed === '') return 0n;
  if (!/^(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(trimmed)) {
    throw new Error('Quantity must be a non-negative number with up to 6 decimal places.');
  }

  const [whole = '', fraction = ''] = trimmed.split('.');
  return BigInt(whole || '0') * QUANTITY_SCALE
    + BigInt(fraction.padEnd(6, '0') || '0');
}

export function validateQuantity(value: string): void {
  parseQuantity(value);
}

function lineAmountMinor(line: InvoiceLine): bigint {
  if (!/^\d+$/.test(line.unitPriceMinor)) {
    throw new Error('Unit price must be stored as a non-negative integer amount.');
  }
  return roundHalfUp(
    parseQuantity(line.quantity) * BigInt(line.unitPriceMinor),
    QUANTITY_SCALE,
  );
}

function lineTotals(
  line: InvoiceLine,
  vatRegistered: boolean,
  taxInclusive: boolean,
): { subtotal: bigint; tax: bigint; total: bigint } {
  const enteredAmount = lineAmountMinor(line);
  const taxable = vatRegistered && line.taxCategory === 'standard';

  if (!Number.isInteger(line.taxRateBps) || line.taxRateBps < 0) {
    throw new Error('Tax rate must be a non-negative whole number of basis points.');
  }

  if (!taxable || line.taxRateBps === 0) {
    return { subtotal: enteredAmount, tax: 0n, total: enteredAmount };
  }

  const rate = BigInt(line.taxRateBps);
  if (taxInclusive) {
    const tax = roundHalfUp(
      enteredAmount * rate,
      10_000n + rate,
    );
    return { subtotal: enteredAmount - tax, tax, total: enteredAmount };
  }

  const tax = roundHalfUp(enteredAmount * rate, 10_000n);
  return { subtotal: enteredAmount, tax, total: enteredAmount + tax };
}

export function computeTotals(
  lines: InvoiceLine[],
  vatRegistered: boolean,
  taxInclusive: boolean,
): InvoiceTotals {
  const breakdown = lines.map(line => lineTotals(line, vatRegistered, taxInclusive));
  const subtotal = breakdown.reduce((sum, line) => sum + line.subtotal, 0n);
  const tax = breakdown.reduce((sum, line) => sum + line.tax, 0n);
  const total = breakdown.reduce((sum, line) => sum + line.total, 0n);

  return {
    subtotalMinor: subtotal.toString(),
    taxMinor: tax.toString(),
    totalMinor: total.toString(),
    lines: breakdown.map(line => ({
      subtotalMinor: line.subtotal.toString(),
      taxMinor: line.tax.toString(),
      totalMinor: line.total.toString(),
    })),
  };
}

export function parseMajorToMinor(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '') return '0';
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) {
    throw new Error('Unit price must be a non-negative amount with up to 2 decimal places.');
  }

  const [whole = '', fraction = ''] = trimmed.split('.');
  return (BigInt(whole || '0') * 100n + BigInt(fraction.padEnd(2, '0') || '0')).toString();
}

export function formatMinorAsMajor(value: string): string {
  if (!/^\d+$/.test(value)) {
    throw new Error('Amount must be stored as a non-negative integer.');
  }
  const minor = BigInt(value);
  return `${minor / 100n}.${(minor % 100n).toString().padStart(2, '0')}`;
}

export function invoiceAmounts(invoice: InvoiceDraft): InvoiceTotals {
  return computeTotals(invoice.lines, invoice.vatRegistered, invoice.taxInclusive);
}
