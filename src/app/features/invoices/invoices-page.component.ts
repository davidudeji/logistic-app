import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { InvoiceDraft, InvoiceLine, InvoiceStatus } from './invoice.model';
import { InvoiceService, INVOICE_CUSTOMERS } from './invoice.service';
import { InvoiceEmailService, SendableInvoice } from './invoice-email.service';
import { formatMinorAsMajor, invoiceAmounts, parseMajorToMinor, validateQuantity } from './invoice-totals';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/auth/auth.service';
import { firstValueFrom } from 'rxjs';

type EditorTab = 'edit' | 'preview';
type InvoiceFilter = 'ALL' | InvoiceStatus;

@Component({
  selector: 'app-invoices-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoices-page.component.html',
})
export class InvoicesPageComponent implements OnInit, OnDestroy {
  private readonly invoiceService = inject(InvoiceService);
  private readonly invoiceEmailService = inject(InvoiceEmailService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private saveTimer: ReturnType<typeof setTimeout> | undefined;
  private expectedVersion = 0;

  readonly customers = INVOICE_CUSTOMERS;
  readonly invoices = this.invoiceService.invoices;
  readonly searchQuery = signal('');
  readonly statusFilter = signal<InvoiceFilter>('ALL');
  readonly activeDraft = signal<InvoiceDraft | null>(null);
  readonly editorTab = signal<EditorTab>('edit');
  readonly saveState = signal<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  readonly lastSavedAt = signal('');
  readonly storageError = signal('');
  readonly sendableInvoices = signal<SendableInvoice[]>([]);
  readonly emailListLoading = signal(false);
  readonly emailListError = signal('');
  readonly emailBusyInvoiceId = signal<string | null>(null);
  readonly canSendInvoices = computed(() => this.auth.hasRole('Administrator', 'Operations Manager'));
  readonly totals = computed(() => {
    const invoice = this.activeDraft();
    return invoice ? invoiceAmounts(invoice) : null;
  });
  readonly filteredInvoices = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const status = this.statusFilter();
    return this.invoices().filter(invoice => {
      const matchesStatus = status === 'ALL' || invoice.status === status;
      const matchesQuery = !query
        || invoice.customerName.toLowerCase().includes(query)
        || invoice.customerEmail.toLowerCase().includes(query)
        || (invoice.reference && invoice.reference.toLowerCase().includes(query));
      return matchesStatus && matchesQuery;
    });
  });
  readonly draftCount = computed(() => this.invoices().filter(invoice => invoice.status === 'DRAFT').length);
  readonly openAmount = computed(() => this.invoices()
    .filter(invoice => invoice.status === 'OPEN')
    .reduce((sum, invoice) => sum + BigInt(invoiceAmounts(invoice).totalMinor), 0n)
    .toString());

  ngOnInit(): void {
    try {
      this.invoiceService.initialize();
    } catch (error) {
      this.storageError.set(this.errorMessage(error));
      this.toast.error(this.errorMessage(error));
    }
    if (this.canSendInvoices()) void this.loadSendableInvoices();
  }

  ngOnDestroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
      this.persistDraft();
    }
  }

  createInvoice(): void {
    try {
      const draft = this.invoiceService.createDraft();
      this.openDraft(draft);
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    }
  }

  editInvoice(id: string): void {
    const invoice = this.invoiceService.getInvoice(id);
    if (!invoice) {
      this.toast.error('This invoice could not be found. Refresh the invoice list and try again.');
      return;
    }
    if (invoice.status !== 'DRAFT') {
      this.toast.info('Only draft invoices can be edited.');
      return;
    }
    this.openDraft(invoice);
  }

  private openDraft(invoice: InvoiceDraft): void {
    this.activeDraft.set({
      ...invoice,
      lines: invoice.lines.map(line => ({ ...line })),
    });
    this.expectedVersion = invoice.version;
    this.editorTab.set('edit');
    this.saveState.set('saved');
    this.lastSavedAt.set('');
  }

  closeEditor(): void {
    if (this.saveNow()) this.activeDraft.set(null);
  }

  patchDraft(patch: Partial<InvoiceDraft>): void {
    this.activeDraft.update(invoice => invoice ? { ...invoice, ...patch } : invoice);
    this.scheduleSave();
  }

  updateCustomer(customerId: string): void {
    const customer = this.customers.find(item => item.id === customerId);
    if (!customer) {
      this.toast.error('Choose a customer from the list.');
      return;
    }
    this.patchDraft({
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerAddress: customer.address,
      customerTin: customer.tin,
    });
  }

  updateLine(index: number, patch: Partial<InvoiceLine>): void {
    if (patch.quantity !== undefined) {
      try {
        validateQuantity(patch.quantity);
      } catch (error) {
        this.toast.error(this.errorMessage(error));
        return;
      }
    }
    this.activeDraft.update(invoice => {
      if (!invoice) return invoice;
      const lines = invoice.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      );
      return { ...invoice, lines };
    });
    this.scheduleSave();
  }

  updateLinePrice(index: number, value: string): void {
    try {
      this.updateLine(index, { unitPriceMinor: parseMajorToMinor(value) });
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    }
  }

  addLine(): void {
    this.activeDraft.update(invoice => {
      if (!invoice) return invoice;
      const id = `${invoice.id}-line-${Date.now()}`;
      return {
        ...invoice,
        lines: [...invoice.lines, {
          id,
          description: '',
          quantity: '1',
          unitPriceMinor: '0',
          taxCategory: 'standard',
          taxRateBps: 750,
        }],
      };
    });
    this.scheduleSave();
  }

  removeLine(index: number): void {
    this.activeDraft.update(invoice => invoice
      ? { ...invoice, lines: invoice.lines.filter((_, lineIndex) => lineIndex !== index) }
      : invoice);
    this.scheduleSave();
  }

  moveLine(index: number, direction: -1 | 1): void {
    this.activeDraft.update(invoice => {
      if (!invoice) return invoice;
      const target = index + direction;
      if (target < 0 || target >= invoice.lines.length) return invoice;
      const lines = [...invoice.lines];
      [lines[index], lines[target]] = [lines[target], lines[index]];
      return { ...invoice, lines };
    });
    this.scheduleSave();
  }

  saveNow(): boolean {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = undefined;
    return this.persistDraft();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveState.set('unsaved');
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      this.persistDraft();
    }, 1400);
  }

  private persistDraft(): boolean {
    const draft = this.activeDraft();
    if (!draft || this.saveState() === 'saved') return true;

    this.saveState.set('saving');
    try {
      const saved = this.invoiceService.saveDraft(draft, this.expectedVersion);
      this.expectedVersion = saved.version;
      this.activeDraft.set(saved);
      this.saveState.set('saved');
      this.lastSavedAt.set(new Intl.DateTimeFormat('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Lagos',
      }).format(new Date(saved.updatedAt)));
      return true;
    } catch (error) {
      this.saveState.set('error');
      this.toast.error(this.errorMessage(error));
      return false;
    }
  }

  setStatusFilter(value: string): void {
    if (value === 'ALL' || value === 'DRAFT' || value === 'OPEN' || value === 'PAID' || value === 'VOID') {
      this.statusFilter.set(value);
    }
  }

  setCurrency(value: string): void {
    if (value === 'NGN' || value === 'USD') this.patchDraft({ currency: value });
  }

  async loadSendableInvoices(): Promise<void> {
    this.emailListLoading.set(true);
    this.emailListError.set('');
    try {
      const response = await firstValueFrom(this.invoiceEmailService.getSendableInvoices());
      this.sendableInvoices.set(response.invoices);
    } catch (error) {
      this.emailListError.set(this.errorMessage(error));
    } finally {
      this.emailListLoading.set(false);
    }
  }

  async sendInvoice(invoice: SendableInvoice): Promise<void> {
    this.emailBusyInvoiceId.set(invoice.id);
    try {
      await firstValueFrom(this.invoiceEmailService.sendInvoice(invoice.id));
      this.toast.success(`Invoice ${invoice.number} emailed to ${invoice.customer.email}.`);
      await this.loadSendableInvoices();
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.emailBusyInvoiceId.set(null);
    }
  }

  async retryInvoiceEmail(invoice: SendableInvoice): Promise<void> {
    if (!invoice.lastEmail) return;
    this.emailBusyInvoiceId.set(invoice.id);
    try {
      await firstValueFrom(this.invoiceEmailService.retryEmail(invoice.lastEmail.id));
      this.toast.success(`Email retry queued for invoice ${invoice.number}.`);
      await this.loadSendableInvoices();
    } catch (error) {
      this.toast.error(this.errorMessage(error));
    } finally {
      this.emailBusyInvoiceId.set(null);
    }
  }

  emailActionLabel(invoice: SendableInvoice): string {
    switch (invoice.lastEmail?.status) {
      case 'queued': return 'Sending…';
      case 'sent': return 'Sent';
      case 'delivered': return 'Delivered';
      case 'failed': return 'Retry email';
      default: return 'Send email';
    }
  }

  emailActionDisabled(invoice: SendableInvoice): boolean {
    return this.emailBusyInvoiceId() === invoice.id
      || invoice.lastEmail?.status === 'queued'
      || invoice.lastEmail?.status === 'sent'
      || invoice.lastEmail?.status === 'delivered';
  }

  runEmailAction(invoice: SendableInvoice): void {
    if (invoice.lastEmail?.status === 'failed') {
      void this.retryInvoiceEmail(invoice);
    } else {
      void this.sendInvoice(invoice);
    }
  }

  setTaxCategory(index: number, value: string): void {
    if (value === 'standard' || value === 'zero-rated' || value === 'exempt') {
      this.updateLine(index, { taxCategory: value });
    }
  }

  invoiceAmountsFor(invoice: InvoiceDraft): string {
    return invoiceAmounts(invoice).totalMinor;
  }

  monogram(name: string): string {
    const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0] ?? '');
    return initials.join('').toUpperCase() || 'N';
  }

  eventValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  eventChecked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  majorAmount(minor: string): string {
    return formatMinorAsMajor(minor);
  }

  money(minor: string, currency: InvoiceDraft['currency'] = this.activeDraft()?.currency ?? 'NGN'): string {
    const [whole, fraction] = formatMinorAsMajor(minor).split('.');
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formatted = `${grouped}.${fraction}`;
    return currency === 'NGN' ? `₦${formatted}` : `USD ${formatted}`;
  }

  lineTotal(index: number): string {
    return this.totals()?.lines[index]?.totalMinor ?? '0';
  }

  formatDate(date: string): string {
    if (!date) return '—';
    const value = new Date(`${date}T12:00:00`);
    return new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Africa/Lagos',
    }).format(value);
  }

  formatCreatedAt(date: string): string {
    return `${new Intl.DateTimeFormat('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Lagos',
    }).format(new Date(date))} WAT`;
  }

  statusLabel(status: InvoiceStatus): string {
    return status === 'DRAFT' ? 'Draft' : status.charAt(0) + status.slice(1).toLowerCase();
  }

  printPreview(): void {
    window.print();
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'The invoice could not be saved.';
  }
}
