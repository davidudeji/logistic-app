import { config } from '../../config/env.js';
import { prisma as defaultPrisma } from '../../config/prisma.js';
import { resend as defaultResend } from '../../config/resend.js';

export class EmailServiceError extends Error {
  constructor(message, status = 500, code = 'EMAIL_SERVICE_ERROR') {
    super(message);
    this.name = 'EmailServiceError';
    this.status = status;
    this.code = code;
  }
}

function stripHeaderBreaks(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

function formatFromHeader(companyName, appName, address) {
  const displayName = stripHeaderBreaks(`${companyName} via ${appName}`)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  return `"${displayName}" <${stripHeaderBreaks(address)}>`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function formatDueDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new EmailServiceError('Invoice due date is invalid.', 422, 'INVALID_INVOICE');
  }
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function placeholderPdf() {
  // TODO: Replace this valid placeholder PDF with the invoice's stored PDF bytes.
  const content = 'BT\n/F1 12 Tf\n50 760 Td\n(PDF generation TODO: stored invoice PDF unavailable)\nTj\nET\n';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`,
  ];
  const chunks = [Buffer.from('%PDF-1.4\n', 'ascii')];
  const offsets = [0];
  let length = chunks[0].length;

  for (let index = 0; index < objects.length; index += 1) {
    const object = Buffer.from(`${index + 1} 0 obj\n${objects[index]}\nendobj\n`, 'ascii');
    offsets.push(length);
    chunks.push(object);
    length += object.length;
  }

  const xrefOffset = length;
  const entries = offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${entries}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`, 'ascii'));
  return Buffer.concat(chunks);
}

function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function utcDayStart(now) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export class EmailService {
  constructor({
    prisma = defaultPrisma,
    resend = defaultResend,
    settings = config,
    now = () => new Date(),
  } = {}) {
    this.prisma = prisma;
    this.resend = resend;
    this.settings = settings;
    this.now = now;
  }

  async listSendableInvoices(tenantId) {
    if (!tenantId) {
      throw new EmailServiceError('Tenant context is required.', 401, 'UNAUTHORIZED');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: ['OPEN', 'PAID'] },
        number: { not: null },
      },
      include: {
        customer: { select: { name: true, email: true } },
        emails: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      dueDate: invoice.dueDate.toISOString().slice(0, 10),
      customer: {
        name: invoice.customer.name,
        email: invoice.customer.email,
      },
      lastEmail: invoice.emails[0] ?? null,
    }));
  }

  async sendInvoice(invoiceId, tenantId, { allowRetry = false } = {}) {
    if (!tenantId) {
      throw new EmailServiceError('Tenant context is required.', 401, 'UNAUTHORIZED');
    }

    const claim = await this.prisma.$transaction(async transaction => {
      const invoice = await transaction.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: {
          customer: { select: { id: true, tenantId: true, name: true, email: true } },
          company: { select: { id: true, tenantId: true, name: true, billingEmail: true } },
        },
      });

      if (!invoice) {
        throw new EmailServiceError('Invoice not found for this tenant.', 404, 'INVOICE_NOT_FOUND');
      }
      if (invoice.status === 'DRAFT') {
        throw new EmailServiceError('Only finalized invoices can be emailed.', 409, 'INVOICE_NOT_FINALIZED');
      }
      if (!invoice.number) {
        throw new EmailServiceError('Finalized invoice is missing its invoice number.', 409, 'INVOICE_NUMBER_MISSING');
      }

      const recipient = stripHeaderBreaks(invoice.customer?.email);
      if (!recipient) {
        throw new EmailServiceError('The invoice customer has no email address.', 422, 'CUSTOMER_EMAIL_REQUIRED');
      }
      if (!isEmailAddress(recipient)) {
        throw new EmailServiceError('The invoice customer email address is invalid.', 422, 'CUSTOMER_EMAIL_INVALID');
      }

      const existing = await transaction.emailMessage.findFirst({
        where: {
          tenantId,
          documentId: invoice.id,
          status: { in: ['queued', 'sent', 'delivered'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return { invoice, message: existing, duplicate: true };

      const failed = await transaction.emailMessage.findFirst({
        where: { tenantId, documentId: invoice.id, status: 'failed' },
        orderBy: { createdAt: 'desc' },
      });
      if (failed && !allowRetry) {
        throw new EmailServiceError('This invoice has a failed send. Use the retry endpoint to create a new attempt.', 409, 'EMAIL_RETRY_REQUIRED');
      }

      const sendsToday = await transaction.emailMessage.count({
        where: { tenantId, createdAt: { gte: utcDayStart(this.now()) } },
      });
      if (sendsToday >= this.settings.emailDailyCapPerTenant) {
        throw new EmailServiceError(
          `Daily invoice email limit reached (${this.settings.emailDailyCapPerTenant} per tenant). Try again tomorrow.`,
          429,
          'EMAIL_DAILY_CAP_EXCEEDED',
        );
      }

      const message = await transaction.emailMessage.create({
        data: {
          tenantId,
          documentId: invoice.id,
          toEmail: recipient,
          status: 'queued',
        },
      });
      return { invoice, message, duplicate: false };
    }, { isolationLevel: 'Serializable' });

    if (claim.duplicate) return claim.message;

    try {
      if (!this.settings.resendApiKey) {
        throw new Error('RESEND_API_KEY is not configured.');
      }
      if (!this.settings.mailFromAddress) {
        throw new Error('MAIL_FROM_ADDRESS is not configured.');
      }

      const companyName = stripHeaderBreaks(claim.invoice.company.name);
      const customerName = stripHeaderBreaks(claim.invoice.customer.name);
      const number = stripHeaderBreaks(claim.invoice.number);
      const appName = stripHeaderBreaks(this.settings.appName);
      const dueDate = formatDueDate(claim.invoice.dueDate);
      const subject = stripHeaderBreaks(`Invoice ${number} from ${companyName}, due ${dueDate}`);
      const fromAddress = stripHeaderBreaks(this.settings.mailFromAddress);
      if (!isEmailAddress(fromAddress)) {
        throw new Error('MAIL_FROM_ADDRESS is not a valid email address.');
      }
      const from = formatFromHeader(companyName, appName, fromAddress);
      const replyTo = stripHeaderBreaks(claim.invoice.company.billingEmail);
      if (replyTo && !isEmailAddress(replyTo)) {
        throw new Error('Company billing email is not a valid Reply-To address.');
      }
      const pdfBytes = claim.invoice.pdfBytes
        ? Buffer.from(claim.invoice.pdfBytes)
        : placeholderPdf();
      const html = `<p>Hello ${escapeHtml(customerName)},</p><p>Please find invoice <strong>${escapeHtml(number)}</strong> from ${escapeHtml(companyName)} attached. It is due ${escapeHtml(dueDate)}.</p><p>Thank you,<br>${escapeHtml(companyName)}</p>`;
      const text = `Hello ${customerName},\n\nPlease find invoice ${number} from ${companyName} attached. It is due ${dueDate}.\n\nThank you,\n${companyName}`;
      const filename = stripHeaderBreaks(`Invoice-${number}.pdf`).replace(/[\\/]/g, '-');
      const payload = {
        from,
        ...(replyTo ? { replyTo } : {}),
        to: [stripHeaderBreaks(claim.invoice.customer.email)],
        subject,
        html,
        text,
        attachments: [{ filename, content: pdfBytes }],
      };

      const result = await this.resend.emails.send(payload, {
        idempotencyKey: `invoice-email/${claim.message.id}`,
      });
      if (result.error) {
        throw new Error(result.error.message || 'Resend rejected the email.');
      }
      if (!result.data?.id) {
        throw new Error('Resend did not return an email ID.');
      }

      return await this.prisma.emailMessage.update({
        where: { id: claim.message.id, tenantId },
        data: { resendId: result.data.id, status: 'sent', error: null },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Email delivery failed.';
      await this.prisma.emailMessage.update({
        where: { id: claim.message.id, tenantId },
        data: { status: 'failed', error: message.slice(0, 2000) },
      });
      throw new EmailServiceError(message, 502, 'EMAIL_SEND_FAILED');
    }
  }

  async retryFailedEmail(emailMessageId, tenantId) {
    const failed = await this.prisma.emailMessage.findFirst({
      where: { id: emailMessageId, tenantId },
    });
    if (!failed) {
      throw new EmailServiceError('Email message not found for this tenant.', 404, 'EMAIL_MESSAGE_NOT_FOUND');
    }
    if (failed.status !== 'failed') {
      throw new EmailServiceError('Only failed email messages can be retried.', 409, 'EMAIL_NOT_FAILED');
    }

    return this.sendInvoice(failed.documentId, tenantId, { allowRetry: true });
  }
}

export const emailService = new EmailService();
