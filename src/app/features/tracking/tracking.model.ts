export type TrackingMarkerKind = 'vehicle' | 'driver' | 'pickup' | 'dropoff';

export interface TrackingMapMarker {
  id: string;
  kind: TrackingMarkerKind;
  latitude: number;
  longitude: number;
  label: string;
  color?: string;
  popupTitle?: string;
  popupDetails?: string[];
}

export interface TrackingPoint {
  jobId: string;
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
}

export function isTrackingPoint(value: unknown): value is TrackingPoint {
  if (!value || typeof value !== 'object') return false;

  const point = value as Partial<TrackingPoint>;
  return (
    typeof point.jobId === 'string' &&
    point.jobId.length > 0 &&
    typeof point.lat === 'number' &&
    Number.isFinite(point.lat) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    typeof point.lng === 'number' &&
    Number.isFinite(point.lng) &&
    point.lng >= -180 &&
    point.lng <= 180 &&
    typeof point.accuracy === 'number' &&
    Number.isFinite(point.accuracy) &&
    point.accuracy >= 0 &&
    (point.speed === null ||
      (typeof point.speed === 'number' && Number.isFinite(point.speed) && point.speed >= 0)) &&
    (point.heading === null ||
      (typeof point.heading === 'number' &&
        Number.isFinite(point.heading) &&
        point.heading >= 0 &&
        point.heading <= 360)) &&
    typeof point.timestamp === 'string' &&
    !Number.isNaN(Date.parse(point.timestamp))
  );
}
