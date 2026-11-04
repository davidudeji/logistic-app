import { config } from '../../config/env.js';

const MAX_BATCH_SIZE = 100;
const MAX_POINT_AGE_MS = config.tracking.retentionDays * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const ALLOWED_POINT_FIELDS = new Set([
  'jobId',
  'lat',
  'lng',
  'accuracy',
  'speed',
  'heading',
  'timestamp',
]);

export function validateTrackingPoints(body, jobId, now = Date.now()) {
  if (!body || typeof body !== 'object' || !Array.isArray(body.points)) {
    return 'Request body must contain a points array.';
  }
  if (body.points.length === 0 || body.points.length > MAX_BATCH_SIZE) {
    return `Batch must contain between 1 and ${MAX_BATCH_SIZE} points.`;
  }

  for (const [index, point] of body.points.entries()) {
    if (!point || typeof point !== 'object' || Array.isArray(point)) {
      return `Point ${index} must be an object.`;
    }
    if (Object.keys(point).some((field) => !ALLOWED_POINT_FIELDS.has(field))) {
      return `Point ${index} contains unsupported fields.`;
    }
    if (point.jobId !== jobId) return `Point ${index} does not match the requested job.`;
    if (
      typeof point.lat !== 'number' ||
      !Number.isFinite(point.lat) ||
      point.lat < -90 ||
      point.lat > 90
    ) {
      return `Point ${index} has an invalid latitude.`;
    }
    if (
      typeof point.lng !== 'number' ||
      !Number.isFinite(point.lng) ||
      point.lng < -180 ||
      point.lng > 180
    ) {
      return `Point ${index} has an invalid longitude.`;
    }
    if (
      typeof point.accuracy !== 'number' ||
      !Number.isFinite(point.accuracy) ||
      point.accuracy < 0 ||
      point.accuracy > 10000
    ) {
      return `Point ${index} has an invalid accuracy.`;
    }
    if (
      point.speed !== null &&
      (typeof point.speed !== 'number' || !Number.isFinite(point.speed) || point.speed < 0)
    ) {
      return `Point ${index} has an invalid speed.`;
    }
    if (
      point.heading !== null &&
      (typeof point.heading !== 'number' ||
        !Number.isFinite(point.heading) ||
        point.heading < 0 ||
        point.heading > 360)
    ) {
      return `Point ${index} has an invalid heading.`;
    }
    if (typeof point.timestamp !== 'string' || Number.isNaN(Date.parse(point.timestamp))) {
      return `Point ${index} has an invalid timestamp.`;
    }

    const recordedAt = Date.parse(point.timestamp);
    if (recordedAt < now - MAX_POINT_AGE_MS) {
      return `Point ${index} is older than the tracking retention window.`;
    }
    if (recordedAt > now + MAX_FUTURE_SKEW_MS) {
      return `Point ${index} is too far in the future.`;
    }
  }

  return null;
}

export function isValidTrackingJobId(jobId) {
  return typeof jobId === 'string' && jobId.trim().length > 0 && jobId.length <= 160;
}

export function parseHistoryLimit(value) {
  if (value === undefined) return 5000;
  if (typeof value !== 'string') return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > 5000) return null;
  return parsed;
}

export function isValidPublicTrackingToken(token) {
  return typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token);
}
