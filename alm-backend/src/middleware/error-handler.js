export function errorHandler(err, req, res, next) {
  const requestId = req.id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const status = err.status || err.statusCode || 500;
  const code = err.code || (status === 400 ? 'VALIDATION_ERROR' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const retryable = status >= 500 || status === 429;

  console.error(`[ALM Error] [${requestId}] ${code}: ${err.message}`);

  res.status(status).json({
    error: {
      code,
      message: err.message || 'An unexpected internal error occurred.',
      requestId,
      retryable,
    },
  });
}
