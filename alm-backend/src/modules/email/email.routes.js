import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { EmailController, emailController } from './email.controller.js';

export function createEmailRouter(controller = emailController) {
  const router = Router();
  const billingRoles = ['Administrator', 'Operations Manager'];

  router.get(
    '/invoices/email-ready',
    authenticate,
    authorize(billingRoles),
    (req, res, next) => controller.listSendableInvoices(req, res, next),
  );
  router.post(
    '/invoices/:id/send',
    authenticate,
    authorize(billingRoles),
    (req, res, next) => controller.sendInvoice(req, res, next),
  );
  router.post(
    '/emails/:id/retry',
    authenticate,
    authorize(billingRoles),
    (req, res, next) => controller.retryEmail(req, res, next),
  );
  router.post(
    '/webhooks/resend',
    (req, res, next) => controller.resendWebhook(req, res, next),
  );

  return router;
}

export const emailRouter = createEmailRouter();

export function createEmailRouterWithController(options) {
  return createEmailRouter(new EmailController(options));
}
