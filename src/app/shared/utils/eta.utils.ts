import { ETAStatus, DeliveryETA } from '../models';

/**
 * Determines ETA status based on estimated arrival vs delivery window.
 * At-risk = within 30 minutes of window end.
 */
export function getETAStatus(
  estimatedArrival: string,
  windowStart?: string,
  windowEnd?: string
): ETAStatus {
  if (!windowEnd) return 'ON_TIME';

  const eta = new Date(estimatedArrival).getTime();
  const end = new Date(windowEnd).getTime();
  const now = Date.now();

  if (eta > end) return 'LATE';

  // At risk if ETA is within 30 min of window end
  const thirtyMin = 30 * 60 * 1000;
  if (end - eta < thirtyMin) return 'AT_RISK';

  return 'ON_TIME';
}

/**
 * Build a DeliveryETA object for a stop.
 */
export function buildDeliveryETA(
  stopId: string,
  estimatedArrival: string,
  deliveryWindowStart?: string,
  deliveryWindowEnd?: string
): DeliveryETA {
  return {
    stopId,
    estimatedArrival,
    deliveryWindowStart,
    deliveryWindowEnd,
    status: getETAStatus(estimatedArrival, deliveryWindowStart, deliveryWindowEnd),
  };
}

/**
 * Returns human-readable ETA label: "On Time", "At Risk", "Late"
 */
export function etaStatusLabel(status: ETAStatus): string {
  switch (status) {
    case 'ON_TIME':  return 'On Time';
    case 'AT_RISK':  return 'At Risk';
    case 'LATE':     return 'Late';
  }
}

/**
 * Format duration in minutes to human-readable string.
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format distance in km.
 */
export function formatDistance(km: number): string {
  return km >= 1000 ? `${(km / 1000).toFixed(1)}k km` : `${km} km`;
}
