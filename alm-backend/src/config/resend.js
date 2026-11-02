import { Resend } from 'resend';
import { config } from './env.js';

export const resend = new Resend(config.resendApiKey || 're_not_configured');
