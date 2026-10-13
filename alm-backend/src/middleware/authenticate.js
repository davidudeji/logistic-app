export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or malformed Authorization header.',
        requestId: req.id || `req_${Date.now()}`,
        retryable: false,
      },
    });
  }

  const token = authHeader.split(' ')[1];

  // Decode mock JWT or real JWT token
  if (token.startsWith('jwt_mock_token_alm_')) {
    const parts = token.split('_');
    const userId = parts[4] || 'USR-FM-01';

    let role = 'Fleet Manager';
    if (userId.startsWith('DRV')) role = 'Driver';
    else if (userId.includes('DISP')) role = 'Dispatcher';
    else if (userId.includes('AUD')) role = 'Auditor';
    else if (userId.includes('ADMIN')) role = 'Administrator';
    else if (userId.includes('OPS')) role = 'Operations Manager';

    req.user = {
      id: userId,
      role,
      tenantId: 'TENANT-NG-01',
      assetId: role === 'Driver' ? 'VEH-TRK-101' : undefined,
    };
    return next();
  }

  // Generic fallback user for testing
  req.user = {
    id: 'USR-DEV-01',
    role: 'Administrator',
    tenantId: 'TENANT-NG-01',
  };

  next();
}
