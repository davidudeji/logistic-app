import { config } from '../../config/env.js';
import { authenticate, resolveDevelopmentUser } from '../../middleware/authenticate.js';

let authenticationAdapter = null;
let assignmentProvider = null;

export function configureTrackingIntegration({ authentication, assignments }) {
  if (
    !authentication ||
    typeof authentication.authenticateRequest !== 'function' ||
    typeof authentication.authenticateToken !== 'function'
  ) {
    throw new TypeError('Tracking authentication adapter must implement request and token authentication.');
  }
  if (
    !assignments ||
    typeof assignments.getDriverAssignment !== 'function' ||
    typeof assignments.getDispatcherJob !== 'function' ||
    typeof assignments.listActiveJobs !== 'function' ||
    typeof assignments.getPublicJob !== 'function'
  ) {
    throw new TypeError('Tracking assignment provider is missing required methods.');
  }

  authenticationAdapter = authentication;
  assignmentProvider = assignments;
}

export function createTrackingRequestAuthenticator({
  environment = config.env,
  getAdapter = () => authenticationAdapter,
  developmentAuthenticator = authenticate,
} = {}) {
  return (req, res, next) => {
    const adapter = getAdapter();
    if (adapter) return adapter.authenticateRequest(req, res, next);

    if (environment === 'production') {
      return res.status(503).json({
        error: {
          code: 'TRACKING_AUTH_PROVIDER_NOT_CONFIGURED',
          message: 'Tracking authentication is not configured for this deployment.',
          requestId: req.id || `req_${Date.now()}`,
          retryable: false,
        },
      });
    }

    return developmentAuthenticator(req, res, next);
  };
}

export const authenticateTracking = createTrackingRequestAuthenticator();

export async function authenticateTrackingToken(token) {
  if (authenticationAdapter) {
    return authenticationAdapter.authenticateToken(token);
  }

  if (config.env === 'production') {
    const error = new Error('Tracking authentication is not configured for this deployment.');
    error.status = 503;
    error.code = 'TRACKING_AUTH_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  if (typeof token !== 'string' || token.length === 0) {
    const error = new Error('A tracking authentication token is required.');
    error.status = 401;
    error.code = 'UNAUTHORIZED';
    throw error;
  }

  return resolveDevelopmentUser(token);
}

export function getTrackingAssignmentProvider() {
  if (!assignmentProvider) {
    const error = new Error('Tracking job assignment integration is not configured.');
    error.status = 503;
    error.code = 'TRACKING_ASSIGNMENT_PROVIDER_NOT_CONFIGURED';
    throw error;
  }

  return assignmentProvider;
}

export function isTrackingIntegrationConfigured() {
  return Boolean(authenticationAdapter && assignmentProvider);
}
