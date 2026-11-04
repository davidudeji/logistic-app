const requestCounts = new Map();
const scopedRequestCounts = new Map();

export function rateLimit({ windowMs = 60000, max = 120 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const record = requestCounts.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 1;
      record.resetAt = now + windowMs;
    } else {
      record.count++;
    }

    requestCounts.set(ip, record);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));

    if (record.count > max) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
          requestId: req.id || `req_${Date.now()}`,
          retryable: true,
        },
      });
    }

    return next();
  };
}

export function rateLimitByKey({ windowMs = 60000, max = 120, keyGenerator } = {}) {
  if (typeof keyGenerator !== 'function') {
    throw new TypeError('A rate-limit key generator is required.');
  }

  return (req, res, next) => {
    const key = keyGenerator(req);
    if (typeof key !== 'string' || key.length === 0) {
      return res.status(400).json({
        error: {
          code: 'RATE_LIMIT_KEY_INVALID',
          message: 'Could not determine a rate-limit identity.',
          requestId: req.id || `req_${Date.now()}`,
          retryable: false,
        },
      });
    }

    const now = Date.now();
    const record = scopedRequestCounts.get(key);
    if (!record || now > record.resetAt) {
      scopedRequestCounts.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      record.count++;
    }

    if (scopedRequestCounts.size > 10000) {
      for (const [storedKey, storedRecord] of scopedRequestCounts) {
        if (now > storedRecord.resetAt) scopedRequestCounts.delete(storedKey);
      }
    }

    const current = scopedRequestCounts.get(key);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current.count));
    if (current.count > max) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later.',
          requestId: req.id || `req_${Date.now()}`,
          retryable: true,
        },
      });
    }

    return next();
  };
}
