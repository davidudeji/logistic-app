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

export type TrackingJobStatus = 'assigned' | 'in_transit' | 'arrived' | 'delivered';

export interface ActiveTrackingJob {
  jobId: string;
  vehicleId: string;
  vehicleRegistration: string;
  driverFirstName: string;
  status: TrackingJobStatus;
  latestPosition: TrackingPoint | null;
}

export interface PublicTrackingSnapshot {
  driverFirstName: string;
  driverPhone: string;
  vehicleRegistration: string;
  status: TrackingJobStatus;
  position: { lat: number; lng: number } | null;
  lastUpdatedAt: string | null;
  eta: string | null;
}

export function isPublicTrackingToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function isPublicTrackingSnapshot(value: unknown): value is PublicTrackingSnapshot {
  if (!value || typeof value !== 'object') return false;

  const allowedFields = new Set([
    'driverFirstName',
    'driverPhone',
    'vehicleRegistration',
    'status',
    'position',
    'lastUpdatedAt',
    'eta',
  ]);
  if (Object.keys(value).some((key) => !allowedFields.has(key))) return false;

  const snapshot = value as Partial<PublicTrackingSnapshot>;
  const hasValidStatus =
    snapshot.status === 'assigned' ||
    snapshot.status === 'in_transit' ||
    snapshot.status === 'arrived' ||
    snapshot.status === 'delivered';
  const hasValidPosition =
    snapshot.position === null ||
    (typeof snapshot.position === 'object' &&
      snapshot.position !== null &&
      Object.keys(snapshot.position).every((key) => key === 'lat' || key === 'lng') &&
      typeof snapshot.position.lat === 'number' &&
      Number.isFinite(snapshot.position.lat) &&
      snapshot.position.lat >= -90 &&
      snapshot.position.lat <= 90 &&
      typeof snapshot.position.lng === 'number' &&
      Number.isFinite(snapshot.position.lng) &&
      snapshot.position.lng >= -180 &&
      snapshot.position.lng <= 180);

  return (
    typeof snapshot.driverFirstName === 'string' &&
    snapshot.driverFirstName.trim().length > 0 &&
    typeof snapshot.driverPhone === 'string' &&
    /^[+0-9(). -]{5,30}$/.test(snapshot.driverPhone) &&
    typeof snapshot.vehicleRegistration === 'string' &&
    snapshot.vehicleRegistration.trim().length > 0 &&
    hasValidStatus &&
    hasValidPosition &&
    (snapshot.lastUpdatedAt === null ||
      (typeof snapshot.lastUpdatedAt === 'string' &&
        !Number.isNaN(Date.parse(snapshot.lastUpdatedAt)))) &&
    (snapshot.eta === null ||
      (typeof snapshot.eta === 'string' && !Number.isNaN(Date.parse(snapshot.eta))))
  );
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

export function isActiveTrackingJob(value: unknown): value is ActiveTrackingJob {
  if (!value || typeof value !== 'object') return false;

  const job = value as Partial<ActiveTrackingJob>;
  return (
    typeof job.jobId === 'string' &&
    job.jobId.length > 0 &&
    typeof job.vehicleId === 'string' &&
    typeof job.vehicleRegistration === 'string' &&
    typeof job.driverFirstName === 'string' &&
    (job.status === 'assigned' ||
      job.status === 'in_transit' ||
      job.status === 'arrived' ||
      job.status === 'delivered') &&
    (job.latestPosition === null ||
      (isTrackingPoint(job.latestPosition) && job.latestPosition.jobId === job.jobId))
  );
}
