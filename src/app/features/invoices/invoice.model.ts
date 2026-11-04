export type InvoiceStatus = 'DRAFT' | 'OPEN' | 'PAID' | 'VOID';
export type InvoiceCurrency = 'NGN' | 'USD';
export type InvoiceTaxCategory = 'standard' | 'zero-rated' | 'exempt';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: string;
  unitPriceMinor: string;
  taxCategory: InvoiceTaxCategory;
  taxRateBps: number;
}

export interface InvoiceDraft {
  id: string;
  tenantId: string;
  number: string | null;
  status: InvoiceStatus;
  version: number;
  currency: InvoiceCurrency;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerTin: string;
  issuerName: string;
  issuerAddress: string;
  issuerTin: string;
  vatRegistered: boolean;
  taxInclusive: boolean;
  reference: string;
  terms: string;
  issueDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  templateKey: 'classic@1';
  lines: InvoiceLine[];
}

export interface InvoiceCustomer {
  id: string;
  name: string;
  email: string;
  address: string;
  tin: string;
}

export interface InvoiceLineTotal {
  subtotalMinor: string;
  taxMinor: string;
  totalMinor: string;
}

export interface InvoiceTotals extends InvoiceLineTotal {
  lines: InvoiceLineTotal[];
}
