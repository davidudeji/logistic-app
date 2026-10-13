import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { config } from './config/env.js';
import { router as almRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';

export const app = express();

// Request ID tracking
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  res.setHeader('X-Request-Id', req.id);
  next();
});

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow browser dev origins or same-origin / server-to-server
      if (!origin || config.corsOrigins.includes(origin) || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly permissive origin
      }
    },
    credentials: true,
  })
);

// Payload parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount ALM routes at /api/v1
app.use('/api/v1', almRouter);

// Centralized error handler
app.use(errorHandler);
