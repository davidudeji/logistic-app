import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';

import { errorHandler } from '../src/middleware/error-handler.js';
import { createEmailRouterWithController } from '../src/modules/email/email.routes.js';
import { EmailService } from '../src/modules/email/email.service.js';
import { ResendWebhookService } from '../src/modules/email/resend-webhook.service.js';

const tenantId = 'tenant-email-test';

function createInvoice(overrides = {}) {
  return {
    id: 'invoice-1',
    tenantId,
    number: 'INV-2026-00001',
    status: 'OPEN',
    dueDate: new Date('2026-12-15T00:00:00.000Z'),
    pdfBytes: Buffer.from('%PDF stored invoice bytes'),
    customer: {
      id: 'customer-1',
      tenantId,
      name: 'Harbor & <Sons>',
      email: 'accounts@harborline.example',
    },
    company: {
      id: 'company-1',
      tenantId,
      name: 'Acme & <Fleet>\r\nBcc: attacker@example.com',
      billingEmail: 'billing@acme.example',
    },
    ...overrides,
  };
}

class FakePrisma {
  constructor({ invoice = createInvoice() } = {}) {
    this.invoiceRecord = invoice;
    this.messages = [];
    this.nextId = 0;
    this.invoice = {
      findFirst: async ({ where }) => (
        this.invoiceRecord?.id === where.id && this.invoiceRecord.tenantId === where.tenantId
          ? this.invoiceRecord
          : null
      ),
      findMany: async ({ where }) => (
        this.invoiceRecord
        && this.invoiceRecord.tenantId === where.tenantId
        && where.status.in.includes(this.invoiceRecord.status)
        && this.invoiceRecord.number
          ? [{
            ...this.invoiceRecord,
            emails: this.messages
              .filter(message => message.documentId === this.invoiceRecord.id)
              .sort((left, right) => right.createdAt - left.createdAt)
              .slice(0, 1),
          }]
          : []
      ),
    };
    this.emailMessage = {
      findFirst: async ({ where }) => this.messages
        .filter(message => this.matchesMessage(message, where))
        .sort((left, right) => right.createdAt - left.createdAt)[0] ?? null,
      count: async ({ where }) => this.messages.filter(message =>
        message.tenantId === where.tenantId && message.createdAt >= where.createdAt.gte,
      ).length,
      create: async ({ data }) => {
        const message = {
          id: `email-${++this.nextId}`,
          ...data,
          resendId: null,
          error: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.messages.push(message);
        return message;
      },
      update: async ({ where, data }) => {
        const message = this.messages.find(row =>
          row.id === where.id && row.tenantId === where.tenantId,
        );
        if (!message) throw new Error('Email message not found.');
        Object.assign(message, data, { updatedAt: new Date() });
        return message;
      },
      updateMany: async ({ where, data }) => {
        const matching = this.messages.filter(message => {
          if (message.resendId !== where.resendId) return false;
          if (where.status?.not && message.status === where.status.not) return false;
          return true;
        });
        matching.forEach(message => Object.assign(message, data, { updatedAt: new Date() }));
        return { count: matching.length };
      },
    };
  }

  $transaction(callback) {
    return callback(this);
  }

  matchesMessage(message, where) {
    if (where.tenantId !== undefined && message.tenantId !== where.tenantId) return false;
    if (where.documentId !== undefined && message.documentId !== where.documentId) return false;
    if (where.id !== undefined && message.id !== where.id) return false;
    if (where.status?.in && !where.status.in.includes(message.status)) return false;
    if (typeof where.status === 'string' && message.status !== where.status) return false;
    return true;
  }
}

function createResend(send = async () => ({ data: { id: 'resend-1' }, error: null })) {
  const mock = {
    calls: [],
    emails: {
      send: async (...args) => {
        mock.calls.push(args);
        return send(...args);
      },
    },
    webhooks: {
      verify: () => {
        throw new Error('Not configured for this test.');
      },
    },
  };
  return mock;
}

function settings(overrides = {}) {
  return {
    resendApiKey: 're_test_server_only',
    mailFromAddress: 'invoices@example.test',
    appName: 'Nexus Logistics',
    emailDailyCapPerTenant: 10,
    ...overrides,
  };
}

function createWebhookApp(webhookService) {
  const app = express();
  app.use('/api/v1/webhooks/resend', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/v1', createEmailRouterWithController({
    emailService: {},
    webhookService,
  }));
  app.use(errorHandler);
  return app;
}

test('invoice email success uses customer data, escaped content, stored PDF, and Resend idempotency', async () => {
  const prisma = new FakePrisma();
  const resend = createResend(async (...args) => {
    assert.equal(prisma.messages.length, 1);
    assert.equal(prisma.messages[0].status, 'queued');
    return { data: { id: 'resend-1' }, error: null };
  });
  const service = new EmailService({ prisma, resend, settings: settings() });

  const message = await service.sendInvoice('invoice-1', tenantId);

  assert.equal(message.status, 'sent');
  assert.equal(message.resendId, 'resend-1');
  assert.equal(message.toEmail, 'accounts@harborline.example');
  assert.equal(resend.calls.length, 1);
  const [payload, options] = resend.calls[0];
  assert.equal(payload.from, '"Acme & <Fleet> Bcc: attacker@example.com via Nexus Logistics" <invoices@example.test>');
  assert.equal(payload.replyTo, 'billing@acme.example');
  assert.deepEqual(payload.to, ['accounts@harborline.example']);
  assert.equal(payload.subject, 'Invoice INV-2026-00001 from Acme & <Fleet> Bcc: attacker@example.com, due 15 Dec 2026');
  assert.match(payload.html, /Harbor &amp; &lt;Sons&gt;/);
  assert.match(payload.html, /Acme &amp; &lt;Fleet&gt; Bcc: attacker@example\.com/);
  assert.equal(payload.text.includes('<Sons>'), true);
  assert.equal(payload.attachments[0].filename, 'Invoice-INV-2026-00001.pdf');
  assert.deepEqual(payload.attachments[0].content, Buffer.from('%PDF stored invoice bytes'));
  assert.deepEqual(options, { idempotencyKey: `invoice-email/${message.id}` });
  assert.equal(payload.from.includes('\r'), false);
  assert.equal(payload.subject.includes('\n'), false);
});

test('invoice email failure persists a failed EmailMessage and its provider error', async () => {
  const prisma = new FakePrisma();
  const resend = createResend(async () => ({
    data: null,
    error: { message: 'Resend unavailable' },
  }));
  const service = new EmailService({ prisma, resend, settings: settings() });

  await assert.rejects(service.sendInvoice('invoice-1', tenantId), {
    message: 'Resend unavailable',
    status: 502,
  });
  assert.equal(prisma.messages.length, 1);
  assert.equal(prisma.messages[0].status, 'failed');
  assert.equal(prisma.messages[0].error, 'Resend unavailable');
});

test('duplicate invoice send returns the existing message without calling Resend again', async () => {
  const prisma = new FakePrisma();
  const resend = createResend();
  const service = new EmailService({ prisma, resend, settings: settings() });

  const first = await service.sendInvoice('invoice-1', tenantId);
  const duplicate = await service.sendInvoice('invoice-1', tenantId);

  assert.equal(duplicate.id, first.id);
  assert.equal(prisma.messages.length, 1);
  assert.equal(resend.calls.length, 1);
});

test('retry of a failed message creates a fresh queued attempt', async () => {
  const prisma = new FakePrisma();
  const resend = createResend(async () => ({ data: null, error: { message: 'temporary failure' } }));
  const service = new EmailService({ prisma, resend, settings: settings() });

  await assert.rejects(service.sendInvoice('invoice-1', tenantId));
  resend.emails.send = async () => ({ data: { id: 'resend-retry' }, error: null });
  const retried = await service.retryFailedEmail(prisma.messages[0].id, tenantId);

  assert.equal(prisma.messages.length, 2);
  assert.notEqual(retried.id, prisma.messages[0].id);
  assert.equal(retried.status, 'sent');
  assert.equal(retried.resendId, 'resend-retry');
});

test('Resend daily cap rejects before creating another message', async () => {
  const prisma = new FakePrisma();
  prisma.messages.push({
    id: 'email-existing',
    tenantId,
    documentId: 'another-invoice',
    status: 'failed',
    createdAt: new Date(),
  });
  const service = new EmailService({
    prisma,
    resend: createResend(),
    settings: settings({ emailDailyCapPerTenant: 1 }),
  });

  await assert.rejects(service.sendInvoice('invoice-1', tenantId), {
    status: 429,
    code: 'EMAIL_DAILY_CAP_EXCEEDED',
  });
  assert.equal(prisma.messages.length, 1);
});

test('draft invoices cannot be sent and missing customer email is rejected', async (t) => {
  await t.test('rejects a draft before inserting a message', async () => {
    const prisma = new FakePrisma({ invoice: createInvoice({ status: 'DRAFT' }) });
    const service = new EmailService({ prisma, resend: createResend(), settings: settings() });

    await assert.rejects(service.sendInvoice('invoice-1', tenantId), {
      status: 409,
      code: 'INVOICE_NOT_FINALIZED',
    });
    assert.equal(prisma.messages.length, 0);
  });

  await t.test('does not trust caller-supplied recipient values', async () => {
    const prisma = new FakePrisma({
      invoice: createInvoice({ customer: { id: 'customer-1', tenantId, name: 'No Email', email: null } }),
    });
    const service = new EmailService({ prisma, resend: createResend(), settings: settings() });

    await assert.rejects(service.sendInvoice('invoice-1', tenantId), {
      status: 422,
      code: 'CUSTOMER_EMAIL_REQUIRED',
    });
    assert.equal(prisma.messages.length, 0);
  });
});

test('Resend webhook maps status and ignores duplicate events for the same Resend email ID', async () => {
  const prisma = new FakePrisma();
  prisma.messages.push({
    id: 'email-sent',
    tenantId,
    documentId: 'invoice-1',
    toEmail: 'accounts@harborline.example',
    status: 'sent',
    resendId: 'resend-1',
    createdAt: new Date(),
  });
  const events = [
    { type: 'email.delivered', data: { email_id: 'resend-1' } },
    { type: 'email.bounced', data: { email_id: 'resend-1' } },
    { type: 'email.complained', data: { email_id: 'resend-1' } },
  ];
  const resend = {
    webhooks: {
      verify: () => events[0],
    },
  };
  const service = new ResendWebhookService({ prisma, resend, webhookSecret: 'whsec_test' });
  const headers = {
    'svix-id': 'evt-1',
    'svix-timestamp': '123',
    'svix-signature': 'v1,test',
  };

  const first = await service.handle(Buffer.from('{}'), headers);
  const duplicate = await service.handle(Buffer.from('{}'), headers);

  assert.deepEqual(first, { received: true, ignored: false });
  assert.deepEqual(duplicate, { received: true, ignored: true });
  assert.equal(prisma.messages[0].status, 'delivered');

  events.shift();
  await service.handle(Buffer.from('{}'), headers);
  assert.equal(prisma.messages[0].status, 'bounced');
  events.shift();
  await service.handle(Buffer.from('{}'), headers);
  assert.equal(prisma.messages[0].status, 'complained');
});

test('Resend webhook returns 400 for an invalid signature', async () => {
  const webhookService = new ResendWebhookService({
    prisma: new FakePrisma(),
    resend: { webhooks: { verify: () => { throw new Error('bad signature'); } } },
    webhookSecret: 'whsec_test',
  });
  const response = await request(createWebhookApp(webhookService))
    .post('/api/v1/webhooks/resend')
    .set('Content-Type', 'application/json')
    .set('svix-id', 'evt-bad')
    .set('svix-timestamp', '123')
    .set('svix-signature', 'invalid')
    .send(Buffer.from('{"type":"email.delivered"}'));

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, 'INVALID_WEBHOOK_SIGNATURE');
});

test('send endpoint uses the authenticated tenant context', async () => {
  const calls = [];
  const app = express();
  app.use('/api/v1/webhooks/resend', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/v1', createEmailRouterWithController({
    emailService: {
      sendInvoice: async (...args) => {
        calls.push(args);
        return { id: 'email-api', status: 'sent' };
      },
    },
    webhookService: {},
  }));
  app.use(errorHandler);

  const response = await request(app)
    .post('/api/v1/invoices/invoice-1/send')
    .set('Authorization', 'Bearer jwt_mock_token_alm_ADMIN');

  assert.equal(response.status, 200);
  assert.deepEqual(calls, [['invoice-1', 'TENANT-NG-01']]);
});

test('email-ready invoice list uses the authenticated tenant and excludes drafts', async () => {
  const service = new EmailService({
    prisma: new FakePrisma({ invoice: createInvoice({ tenantId: 'TENANT-NG-01' }) }),
    resend: createResend(),
    settings: settings(),
  });
  const app = express();
  app.use('/api/v1/webhooks/resend', express.raw({ type: 'application/json' }));
  app.use(express.json());
  app.use('/api/v1', createEmailRouterWithController({
    emailService: service,
    webhookService: {},
  }));
  app.use(errorHandler);

  const response = await request(app)
    .get('/api/v1/invoices/email-ready')
    .set('Authorization', 'Bearer jwt_mock_token_alm_USR-ADMIN-01');

  assert.equal(response.status, 200);
  assert.deepEqual(response.body.invoices, [{
    id: 'invoice-1',
    number: 'INV-2026-00001',
    status: 'OPEN',
    dueDate: '2026-12-15',
    customer: { name: 'Harbor & <Sons>', email: 'accounts@harborline.example' },
    lastEmail: null,
  }]);

  const draftService = new EmailService({
    prisma: new FakePrisma({ invoice: createInvoice({ status: 'DRAFT' }) }),
    resend: createResend(),
    settings: settings(),
  });
  assert.deepEqual(await draftService.listSendableInvoices(tenantId), []);
});
