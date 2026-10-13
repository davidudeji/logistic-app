import { isValidCoordinatePair } from '../../middleware/validate-request.js';

export function validateOptimizeRouteRequest(body) {
  if (!body.assetId || typeof body.assetId !== 'string') {
    return 'assetId is required and must be a string.';
  }

  if (!Array.isArray(body.deliveryIds) || body.deliveryIds.length === 0) {
    return 'deliveryIds is required and must be a non-empty array of delivery IDs.';
  }

  if (!isValidCoordinatePair(body.origin)) {
    return 'origin is required and must be a valid coordinate pair [longitude, latitude].';
  }

  if (body.destination && !isValidCoordinatePair(body.destination)) {
    return 'destination must be a valid coordinate pair [longitude, latitude].';
  }

  return null;
}
