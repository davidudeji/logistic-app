import { config } from '../../config/env.js';
import { prisma as defaultPrisma } from '../../config/prisma.js';
import { resend as defaultResend } from '../../config/resend.js';
import { EmailServiceError } from './email.service.js';

const EVENT_STATUS = new Map([
  ['email.delivered', 'delivered'],
  ['email.bounced', 'bounced'],
  ['email.complained', 'complained'],
]);

export class ResendWebhookService {
  constructor({
    prisma = defaultPrisma,
    resend = defaultResend,
    webhookSecret = config.resendWebhookSecret,
  } = {}) {
    this.prisma = prisma;
    this.resend = resend;
    this.webhookSecret = webhookSecret;
  }

  async handle(payload, headers) {
    if (!Buffer.isBuffer(payload)) {
      throw new EmailServiceError('Webhook request body must be raw JSON bytes.', 400, 'INVALID_WEBHOOK_BODY');
    }
    if (!this.webhookSecret) {
      throw new EmailServiceError('Resend webhook secret is not configured.', 503, 'WEBHOOK_NOT_CONFIGURED');
    }

    const signatureHeaders = {
      id: headers['svix-id'],
      timestamp: headers['svix-timestamp'],
      signature: headers['svix-signature'],
    };
    if (!signatureHeaders.id || !signatureHeaders.timestamp || !signatureHeaders.signature) {
      throw new EmailServiceError('Required Resend signature headers are missing.', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    let event;
    try {
      event = this.resend.webhooks.verify({
        payload: payload.toString('utf8'),
        headers: signatureHeaders,
        webhookSecret: this.webhookSecret,
      });
    } catch {
      throw new EmailServiceError('Resend webhook signature is invalid.', 400, 'INVALID_WEBHOOK_SIGNATURE');
    }

    const status = EVENT_STATUS.get(event.type);
    const resendId = event.data?.email_id;
    if (!status || typeof resendId !== 'string' || !resendId) {
      return { received: true, ignored: true };
    }

    const result = await this.prisma.emailMessage.updateMany({
      where: {
        resendId,
        status: { not: status },
      },
      data: { status },
    });

    return { received: true, ignored: result.count === 0 };
  }
}

export const resendWebhookService = new ResendWebhookService();
