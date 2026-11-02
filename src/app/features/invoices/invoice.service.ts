import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { InvoiceCustomer, InvoiceDraft, InvoiceLine, InvoiceStatus, InvoiceTaxCategory } from './invoice.model';
import { validateQuantity } from './invoice-totals';

const TENANT_ID = 'demo-tenant';
const STORAGE_KEY = `logistic-app.invoice-drafts.v1.${TENANT_ID}`;

export const INVOICE_CUSTOMERS: InvoiceCustomer[] = [
  {
    id: 'harborline-foods',
    name: 'Harborline Foods Ltd',
    email: 'accounts@harborline.example',
    address: '14 Creek Road, Apapa, Lagos',
    tin: 'TIN-2048-771',
  },
  {
    id: 'northstar-trading',
    name: 'Northstar Trading Co.',
    email: 'finance@northstar.example',
    address: '8 Ahmadu Bello Way, Victoria Island, Lagos',
    tin: '',
  },
  {
    id: 'greenfield-produce',
    name: 'Greenfield Produce Ltd',
    email: 'billing@greenfield.example',
    address: '22 Ring Road, Ibadan, Oyo State',
    tin: 'TIN-3072-615',
  },
];

function newLine(id: string, description = ''): InvoiceLine {
  return {
    id,
    description,
    quantity: '1',
    unitPriceMinor: '0',
    taxCategory: 'standard',
    taxRateBps: 750,
  };
}

function makeDraft(id: string, customer: InvoiceCustomer, daysAgo = 0): InvoiceDraft {
  const now = new Date();
  const created = new Date(now.getTime() - daysAgo * 86_400_000);
  const due = new Date(created.getTime() + 30 * 86_400_000);

  return {
    id,
    tenantId: 'demo-tenant',
    number: null,
    status: 'DRAFT',
    version: 1,
    currency: 'NGN',
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    customerAddress: customer.address,
    customerTin: customer.tin,
    issuerName: 'NexusOps Logistics Ltd',
    issuerAddress: '18 Marina Road, Lagos Island, Lagos',
    issuerTin: '',
    vatRegistered: true,
    taxInclusive: false,
    reference: '',
    terms: 'Payment due within 30 days',
    issueDate: created.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    createdAt: created.toISOString(),
    updatedAt: created.toISOString(),
    templateKey: 'classic@1',
    lines: [
      { ...newLine(`${id}-line-1`, 'Haulage and delivery service'), unitPriceMinor: '48500000' },
      { ...newLine(`${id}-line-2`, 'Fuel surcharge'), quantity: '1', unitPriceMinor: '7250000' },
    ],
  };
}

function sampleDrafts(): InvoiceDraft[] {
  return [
    makeDraft('draft-harborline', INVOICE_CUSTOMERS[0], 0),
    makeDraft('draft-northstar', INVOICE_CUSTOMERS[1], 2),
    makeDraft('draft-greenfield', INVOICE_CUSTOMERS[2], 5),
  ];
}

function isInvoiceStatus(value: unknown): value is InvoiceStatus {
  return value === 'DRAFT' || value === 'OPEN' || value === 'PAID' || value === 'VOID';
}

function isTaxCategory(value: unknown): value is InvoiceTaxCategory {
  return value === 'standard' || value === 'zero-rated' || value === 'exempt';
}

function isInvoiceLine(value: unknown): value is InvoiceLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Record<string, unknown>;
  if (
    typeof line['id'] !== 'string'
    || typeof line['description'] !== 'string'
    || typeof line['quantity'] !== 'string'
    || typeof line['unitPriceMinor'] !== 'string'
    || !/^\d+$/.test(line['unitPriceMinor'])
    || !isTaxCategory(line['taxCategory'])
    || typeof line['taxRateBps'] !== 'number'
    || !Number.isInteger(line['taxRateBps'])
    || line['taxRateBps'] < 0
  ) return false;
  try {
    validateQuantity(line['quantity']);
  } catch {
    return false;
  }
  return true;
}

function isInvoiceDraft(value: unknown): value is InvoiceDraft {
  if (!value || typeof value !== 'object') return false;
  const invoice = value as Record<string, unknown>;
  return typeof invoice['id'] === 'string'
    && typeof invoice['tenantId'] === 'string'
    && typeof invoice['version'] === 'number'
    && Number.isInteger(invoice['version'])
    && invoice['version'] > 0
    && (invoice['number'] === null || typeof invoice['number'] === 'string')
    && isInvoiceStatus(invoice['status'])
    && (invoice['currency'] === 'NGN' || invoice['currency'] === 'USD')
    && typeof invoice['customerId'] === 'string'
    && typeof invoice['customerName'] === 'string'
    && typeof invoice['customerEmail'] === 'string'
    && typeof invoice['customerAddress'] === 'string'
    && typeof invoice['customerTin'] === 'string'
    && typeof invoice['issuerName'] === 'string'
    && typeof invoice['issuerAddress'] === 'string'
    && typeof invoice['issuerTin'] === 'string'
    && typeof invoice['vatRegistered'] === 'boolean'
    && typeof invoice['taxInclusive'] === 'boolean'
    && typeof invoice['reference'] === 'string'
    && typeof invoice['terms'] === 'string'
    && typeof invoice['issueDate'] === 'string'
    && typeof invoice['dueDate'] === 'string'
    && typeof invoice['createdAt'] === 'string'
    && typeof invoice['updatedAt'] === 'string'
    && invoice['templateKey'] === 'classic@1'
    && Array.isArray(invoice['lines'])
    && invoice['lines'].every(isInvoiceLine);
}

function decodeInvoices(stored: string): InvoiceDraft[] {
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isInvoiceDraft)) {
    throw new Error('Saved invoice data is invalid. Clear this browser’s invoice storage to continue.');
  }
  return parsed;
}

function readStoredInvoices(): InvoiceDraft[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? sampleDrafts() : decodeInvoices(stored);
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly state = signal<InvoiceDraft[]>([]);
  readonly invoices = computed(() => this.state().filter(invoice => invoice.tenantId === TENANT_ID));
  private idSequence = 0;
  private initialized = false;

  initialize(): void {
    if (this.initialized || !this.browser) return;
    const invoices = readStoredInvoices();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    this.state.set(invoices);
    this.initialized = true;
    window.addEventListener('storage', this.handleStorage);
  }

  getInvoice(id: string): InvoiceDraft | undefined {
    return this.invoices().find(invoice => invoice.id === id);
  }

  createDraft(): InvoiceDraft {
    this.initialize();
    const id = `draft-${Date.now()}-${++this.idSequence}`;
    const draft: InvoiceDraft = {
      ...makeDraft(id, INVOICE_CUSTOMERS[0]),
      lines: [newLine(`${id}-line-1`)],
    };
    const invoices = [draft, ...this.readLatest()];
    this.persist(invoices);
    return draft;
  }

  saveDraft(draft: InvoiceDraft, expectedVersion: number): InvoiceDraft {
    this.initialize();
    if (draft.tenantId !== TENANT_ID) {
      throw new Error('This invoice belongs to a different tenant.');
    }
    const latest = this.readLatest();
    const current = latest.find(invoice => invoice.tenantId === TENANT_ID && invoice.id === draft.id);
    if (!current || current.status !== 'DRAFT') {
      throw new Error('This invoice is no longer an editable draft.');
    }
    if (current.version !== expectedVersion) {
      this.state.set(latest);
      throw new Error('This draft changed in another tab. Reopen it before saving again.');
    }

    const saved: InvoiceDraft = {
      ...draft,
      version: expectedVersion + 1,
      updatedAt: new Date().toISOString(),
    };
    this.persist(latest.map(invoice => invoice.id === saved.id ? saved : invoice));
    return saved;
  }

  private readLatest(): InvoiceDraft[] {
    return this.browser ? readStoredInvoices() : this.state();
  }

  private persist(invoices: InvoiceDraft[]): void {
    if (this.browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    this.state.set(invoices);
  }

  private readonly handleStorage = (event: StorageEvent): void => {
    if (event.key === STORAGE_KEY && event.newValue !== null) {
      this.state.set(decodeInvoices(event.newValue));
    }
  };
}
