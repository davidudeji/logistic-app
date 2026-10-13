export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before authorization check.',
          requestId: req.id || `req_${Date.now()}`,
          retryable: false,
        },
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `Role "${req.user.role}" is not authorized to access this resource. Required: ${allowedRoles.join(', ')}`,
          requestId: req.id || `req_${Date.now()}`,
          retryable: false,
        },
      });
    }

    next();
  };
}
