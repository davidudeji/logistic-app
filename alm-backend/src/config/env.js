import 'dotenv/config';

function positiveInteger(value, defaultValue, variableName) {
  if (value === undefined || value === '') return defaultValue;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer.`);
  }
  return parsed;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:4000').split(','),

  mapbox: {
    token: process.env.MAPBOX_TOKEN || '',
    timeoutMs: parseInt(process.env.MAPBOX_TIMEOUT_MS || '10000', 10),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_VISION_MODEL || 'gpt-4o',
    timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10),
  },

  s3: {
    region: process.env.AWS_REGION || 'eu-west-1',
    bucket: process.env.AWS_S3_BUCKET || 'logistic-alm-epod-documents',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    serverSideEncryption: process.env.S3_SERVER_SIDE_ENCRYPTION || 'AES256',
  },

  databaseUrl: process.env.DATABASE_URL || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET || '',
  mailFromAddress: process.env.MAIL_FROM_ADDRESS || '',
  appName: process.env.APP_NAME || 'NexusOps',
  emailDailyCapPerTenant: positiveInteger(
    process.env.EMAIL_DAILY_CAP_PER_TENANT,
    100,
    'EMAIL_DAILY_CAP_PER_TENANT',
  ),
  tracking: {
    integrationModule: process.env.TRACKING_INTEGRATION_MODULE || '',
    retentionDays: positiveInteger(process.env.TRACKING_RETENTION_DAYS, 30, 'TRACKING_RETENTION_DAYS'),
    publicDeliveryGraceHours: positiveInteger(
      process.env.TRACKING_PUBLIC_DELIVERY_GRACE_HOURS,
      2,
      'TRACKING_PUBLIC_DELIVERY_GRACE_HOURS',
    ),
    driverRateLimitPerMinute: positiveInteger(
      process.env.TRACKING_DRIVER_RATE_LIMIT_PER_MINUTE,
      120,
      'TRACKING_DRIVER_RATE_LIMIT_PER_MINUTE',
    ),
    publicRateLimitPerMinute: positiveInteger(
      process.env.TRACKING_PUBLIC_RATE_LIMIT_PER_MINUTE,
      60,
      'TRACKING_PUBLIC_RATE_LIMIT_PER_MINUTE',
    ),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
