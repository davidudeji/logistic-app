import { emailService as defaultEmailService } from './email.service.js';
import { resendWebhookService as defaultWebhookService } from './resend-webhook.service.js';

export class EmailController {
  constructor({
    emailService = defaultEmailService,
    webhookService = defaultWebhookService,
  } = {}) {
    this.emailService = emailService;
    this.webhookService = webhookService;
  }

  async listSendableInvoices(req, res, next) {
    try {
      const invoices = await this.emailService.listSendableInvoices(req.user.tenantId);
      res.status(200).json({ invoices });
    } catch (error) {
      next(error);
    }
  }

  async sendInvoice(req, res, next) {
    try {
      const message = await this.emailService.sendInvoice(req.params.id, req.user.tenantId);
      res.status(message.status === 'failed' ? 502 : 200).json(message);
    } catch (error) {
      next(error);
    }
  }

  async retryEmail(req, res, next) {
    try {
      const message = await this.emailService.retryFailedEmail(req.params.id, req.user.tenantId);
      res.status(message.status === 'failed' ? 502 : 200).json(message);
    } catch (error) {
      next(error);
    }
  }

  async resendWebhook(req, res, next) {
    try {
      const result = await this.webhookService.handle(req.body, req.headers);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const emailController = new EmailController();
