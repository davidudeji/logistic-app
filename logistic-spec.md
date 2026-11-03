Implement invoice email sending via Resend . Read my existing code first and follow its structure and naming.

Install the `resend` package. Read config from env: RESEND_API_KEY, RESEND_WEBHOOK_SECRET, MAIL_FROM_ADDRESS. Never expose these to the Angular app.

1. Add an `EmailMessage` Prisma model: id, tenantId, documentId, toEmail, status (queued | sent | delivered | bounced | complained | failed), resendId (nullable), error (nullable), createdAt, updatedAt. Create the migration.

2. Create an `EmailService.sendInvoice(invoiceId)` that:
   - loads the invoice, its customer and the company, filtered by tenantId
   - takes the recipient only from the customer record, and fails if there is no email
   - gets the stored PDF bytes (reuse my existing PDF function or storage; if none exists yet, use a placeholder buffer and mark it with a TODO)
   - inserts an EmailMessage row with status "queued" first
   - calls resend.emails.send with: from `"{Company name} via {App name} <MAIL_FROM_ADDRESS>"`, replyTo = company billing email, to = [customer email], subject `Invoice {number} from {Company name}, due {dueDate}`, an html body and a plain-text body, and the PDF as an attachment named `Invoice-{number}.pdf`
   - passes the idempotency key `invoice-email/{emailMessage.id}`
   - on success stores resendId and sets status "sent"; on error stores the message and sets "failed"
   - strips CR/LF from every header field (subject, names) and HTML-escapes company and customer text

3. Add `POST /invoices/:id/send`: only allowed when the invoice is finalized (not DRAFT), then calls the service. Add `POST /emails/:id/retry` for failed messages, which creates a new EmailMessage row.

4. Add `POST /webhooks/resend`: verify the signature with RESEND_WEBHOOK_SECRET on the raw request body, ignore duplicate events by resendId, and map email.delivered, email.bounced and email.complained to the matching status. Return 200 quickly.

5. Add a per-tenant daily send cap from EMAIL_DAILY_CAP_PER_TENANT, rejecting with a clear error when exceeded.

Do not guess Resend SDK argument names. Check the installed package's TypeScript types for replyTo, attachments, idempotency key and webhook verification, and tell me where you were unsure. Add tests that mock Resend for: success, failure, duplicate send, bad signature. Show me a summary of changed files when done.