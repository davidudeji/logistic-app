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
  logLevel: process.env.LOG_LEVEL || 'info',
};
