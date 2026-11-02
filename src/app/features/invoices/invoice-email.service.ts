import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';

export type InvoiceEmailStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed';

export interface SendableInvoice {
  id: string;
  number: string;
  status: 'OPEN' | 'PAID';
  dueDate: string;
  customer: {
    name: string;
    email: string | null;
  };
  lastEmail: {
    id: string;
    status: InvoiceEmailStatus;
    createdAt: string;
  } | null;
}

export interface InvoiceEmailMessage {
  id: string;
  status: InvoiceEmailStatus;
}

@Injectable({ providedIn: 'root' })
export class InvoiceEmailService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api/v1';

  getSendableInvoices(): Observable<{ invoices: SendableInvoice[] }> {
    return this.http.get<{ invoices: SendableInvoice[] }>(`${this.baseUrl}/invoices/email-ready`)
      .pipe(catchError(error => this.handleError(error)));
  }

  sendInvoice(invoiceId: string): Observable<InvoiceEmailMessage> {
    return this.http.post<InvoiceEmailMessage>(`${this.baseUrl}/invoices/${encodeURIComponent(invoiceId)}/send`, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  retryEmail(emailMessageId: string): Observable<InvoiceEmailMessage> {
    return this.http.post<InvoiceEmailMessage>(`${this.baseUrl}/emails/${encodeURIComponent(emailMessageId)}/retry`, {})
      .pipe(catchError(error => this.handleError(error)));
  }

  private handleError(error: unknown): Observable<never> {
    const message = error instanceof HttpErrorResponse
      ? error.error?.error?.message ?? error.message
      : error instanceof Error ? error.message : 'Invoice email request failed.';
    return throwError(() => new Error(message));
  }
}
