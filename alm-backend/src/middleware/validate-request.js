export function validateRequest(schemaFn) {
  return (req, res, next) => {
    try {
      const validationError = schemaFn(req.body);
      if (validationError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError,
            requestId: req.id || `req_${Date.now()}`,
            retryable: false,
          },
        });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function isValidCoordinatePair(coord) {
  if (!Array.isArray(coord) || coord.length !== 2) return false;
  const [lng, lat] = coord;
  return (
    typeof lng === 'number' &&
    typeof lat === 'number' &&
    !isNaN(lng) &&
    !isNaN(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}
