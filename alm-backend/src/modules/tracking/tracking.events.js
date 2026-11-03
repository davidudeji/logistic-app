import { EventEmitter } from 'node:events';

export const trackingEvents = new EventEmitter();
trackingEvents.setMaxListeners(0);

export function publishTrackingPoint(event) {
  trackingEvents.emit('position', event);
}
