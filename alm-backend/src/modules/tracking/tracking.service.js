import { createHash, randomBytes } from 'node:crypto';
import { config } from '../../config/env.js';
import { prisma as defaultPrisma } from '../../config/prisma.js';
import { getTrackingAssignmentProvider } from './tracking.integration.js';
import { publishTrackingPoint } from './tracking.events.js';
import { isValidPublicTrackingToken } from './tracking.validation.js';

const ACTIVE_STATUSES = new Set(['assigned', 'in_transit', 'arrived']);
const TRACKING_STATUSES = new Set([...ACTIVE_STATUSES, 'delivered']);
const PUBLIC_PHONE_PATTERN = /^[+0-9(). -]{5,30}$/;

function trackingError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function requireText(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw trackingError(
      503,
      'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
      `The tracking assignment provider returned an invalid ${fieldName}.`
    );
  }
  return value;
}

function requireJobStatus(status) {
  if (!TRACKING_STATUSES.has(status)) {
    throw trackingError(
      503,
      'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
      'The tracking assignment provider returned an invalid job status.'
    );
  }
  return status;
}

function requireTenantScope(job, tenantId) {
  if (
    typeof tenantId !== 'string' ||
    tenantId.length === 0 ||
    !job ||
    typeof job.tenantId !== 'string' ||
    job.tenantId !== tenantId
  ) {
    throw trackingError(404, 'TRACKING_JOB_NOT_FOUND', 'Tracking job was not found.');
  }
  return job;
}

function requireTenantJobScope(job, jobId, tenantId) {
  requireTenantScope(job, tenantId);
  if (job.jobId !== jobId) {
    throw trackingError(404, 'TRACKING_JOB_NOT_FOUND', 'Tracking job was not found.');
  }
  return job;
}

function parseDate(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    throw trackingError(
      503,
      'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
      `The tracking assignment provider returned an invalid ${fieldName}.`
    );
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw trackingError(
      503,
      'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
      `The tracking assignment provider returned an invalid ${fieldName}.`
    );
  }
  return date;
}

function publicTokenHash(token) {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export class TrackingService {
  constructor({
    prisma = defaultPrisma,
    assignments = null,
    now = () => new Date(),
    deliveryGraceMs = config.tracking.publicDeliveryGraceHours * 60 * 60 * 1000,
    retentionDays = config.tracking.retentionDays,
  } = {}) {
    this.prisma = prisma;
    this.assignmentProvider = assignments;
    this.now = now;
    this.deliveryGraceMs = deliveryGraceMs;
    this.retentionDays = retentionDays;
  }

  get assignments() {
    return this.assignmentProvider ?? getTrackingAssignmentProvider();
  }

  async uploadPoints(jobId, user, points) {
    const assignment = await this.assignments.getDriverAssignment(jobId, user);
    if (!assignment || assignment.driverId !== user.id) {
      throw trackingError(403, 'TRACKING_JOB_NOT_ASSIGNED', 'Driver is not assigned to this job.');
    }
    requireTenantJobScope(assignment, jobId, user.tenantId);
    if (!ACTIVE_STATUSES.has(requireJobStatus(assignment.status))) {
      throw trackingError(409, 'TRACKING_JOB_NOT_ACTIVE', 'Tracking is not accepting points for this job.');
    }
    const vehicleId = requireText(assignment.vehicleId, 'vehicle ID');

    const orderedPoints = [...points].sort(
      (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
    );
    const data = orderedPoints.map((point) => ({
      tenantId: assignment.tenantId,
      jobId,
      vehicleId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy,
      speed: point.speed,
      heading: point.heading,
      recordedAt: new Date(point.timestamp),
    }));

    await this.prisma.locationPoint.createMany({ data });
    for (const point of orderedPoints) {
      publishTrackingPoint({
        tenantId: assignment.tenantId,
        jobId,
        point: {
          ...point,
          timestamp: new Date(point.timestamp).toISOString(),
        },
      });
    }

    return { accepted: data.length };
  }

  async listActiveJobs(user) {
    const assignments = await this.assignments.listActiveJobs(user);
    if (!Array.isArray(assignments)) {
      throw trackingError(
        503,
        'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
        'The tracking assignment provider returned an invalid active-jobs response.'
      );
    }

    const jobs = assignments.map((job) => {
      requireTenantScope(job, user.tenantId);
      if (!ACTIVE_STATUSES.has(requireJobStatus(job.status))) {
        throw trackingError(
          503,
          'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
          'The tracking assignment provider returned a non-active job.'
        );
      }
      return {
        jobId: requireText(job.jobId, 'job ID'),
        vehicleId: requireText(job.vehicleId, 'vehicle ID'),
        vehicleRegistration: requireText(job.vehicleRegistration, 'vehicle registration'),
        driverFirstName: requireText(job.driverFirstName, 'driver first name'),
        status: job.status,
        tenantId: job.tenantId,
      };
    });

    if (jobs.length === 0) return [];

    const latestPoints = await Promise.all(
      jobs.map((job) => this.prisma.locationPoint.findFirst({
        where: {
          tenantId: user.tenantId,
          jobId: job.jobId,
          recordedAt: { gte: this.getRetentionCutoff() },
        },
        orderBy: { recordedAt: 'desc' },
      }))
    );

    return jobs.map(({ tenantId, ...job }, index) => ({
      ...job,
      latestPosition: this.toTrackingPoint(latestPoints[index]),
    }));
  }

  async getHistory(jobId, user, limit = 5000) {
    const job = await this.assignments.getDispatcherJob(jobId, user);
    requireTenantJobScope(job, jobId, user.tenantId);
    const points = await this.prisma.locationPoint.findMany({
      where: {
        tenantId: user.tenantId,
        jobId,
        recordedAt: { gte: this.getRetentionCutoff() },
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
    return points.reverse().map((point) => this.toTrackingPoint(point));
  }

  async createPublicToken(jobId, user) {
    const job = await this.assignments.getDispatcherJob(jobId, user);
    requireTenantJobScope(job, jobId, user.tenantId);
    const status = requireJobStatus(job.status);
    let expiresAt = null;
    if (status === 'delivered') {
      const deliveredAt = parseDate(job.deliveredAt, 'delivery time');
      expiresAt = new Date(deliveredAt.getTime() + this.deliveryGraceMs);
      if (expiresAt <= this.now()) {
        throw trackingError(410, 'TRACKING_LINK_EXPIRED', 'Delivery tracking link has expired.');
      }
    }

    const token = randomBytes(32).toString('base64url');
    await this.prisma.publicTrackingToken.create({
      data: {
        tokenHash: publicTokenHash(token),
        tenantId: job.tenantId,
        jobId,
        expiresAt,
      },
    });

    return { token, expiresAt: expiresAt?.toISOString() ?? null };
  }

  async getPublicSnapshot(token) {
    const { link, job, status } = await this.getPublicContext(token);

    const driverFirstName = requireText(job.driverFirstName, 'driver first name');
    const vehicleRegistration = requireText(job.vehicleRegistration, 'vehicle registration');
    if (typeof job.driverPhone !== 'string' || !PUBLIC_PHONE_PATTERN.test(job.driverPhone)) {
      throw trackingError(
        503,
        'TRACKING_ASSIGNMENT_PROVIDER_INVALID',
        'The tracking assignment provider returned an invalid driver phone number.'
      );
    }

    const latest = await this.prisma.locationPoint.findFirst({
      where: {
        tenantId: link.tenantId,
        jobId: link.jobId,
        recordedAt: { gte: this.getRetentionCutoff() },
      },
      orderBy: { recordedAt: 'desc' },
    });

    return {
      driverFirstName,
      driverPhone: job.driverPhone,
      vehicleRegistration,
      status,
      position: latest ? { lat: latest.lat, lng: latest.lng } : null,
      lastUpdatedAt: latest ? new Date(latest.recordedAt).toISOString() : null,
      eta: null,
    };
  }

  async getPublicTrackingScope(token) {
    const { link, expiresAt } = await this.getPublicContext(token);
    return {
      tenantId: link.tenantId,
      jobId: link.jobId,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    };
  }

  async getPublicContext(token) {
    if (!isValidPublicTrackingToken(token)) {
      throw trackingError(404, 'TRACKING_LINK_NOT_FOUND', 'Tracking link was not found.');
    }

    const link = await this.prisma.publicTrackingToken.findUnique({
      where: { tokenHash: publicTokenHash(token) },
    });
    if (!link || link.revokedAt) {
      throw trackingError(404, 'TRACKING_LINK_NOT_FOUND', 'Tracking link was not found.');
    }

    const job = await this.assignments.getPublicJob(link.jobId, link.tenantId);
    if (!job || job.tenantId !== link.tenantId || job.jobId !== link.jobId) {
      throw trackingError(404, 'TRACKING_LINK_NOT_FOUND', 'Tracking link was not found.');
    }

    const status = requireJobStatus(job.status);
    let expiresAt = link.expiresAt;
    if (status === 'delivered' && !expiresAt) {
      const deliveredAt = parseDate(job.deliveredAt, 'delivery time');
      expiresAt = new Date(deliveredAt.getTime() + this.deliveryGraceMs);
      await this.prisma.publicTrackingToken.update({
        where: { tokenHash: link.tokenHash },
        data: { expiresAt },
      });
    }
    if (expiresAt && new Date(expiresAt) <= this.now()) {
      throw trackingError(410, 'TRACKING_LINK_EXPIRED', 'Delivery tracking link has expired.');
    }

    return { link, job, status, expiresAt };
  }

  async authorizeSocketSubscription(jobId, user) {
    let job;
    if (user.role === 'Driver') {
      job = await this.assignments.getDriverAssignment(jobId, user);
      if (!job || job.driverId !== user.id) {
        throw trackingError(403, 'TRACKING_JOB_NOT_ASSIGNED', 'Driver is not assigned to this job.');
      }
    } else if (['Dispatcher', 'Operations Manager', 'Administrator'].includes(user.role)) {
      job = await this.assignments.getDispatcherJob(jobId, user);
    } else {
      throw trackingError(403, 'FORBIDDEN', 'User cannot subscribe to tracking updates.');
    }

    requireTenantJobScope(job, jobId, user.tenantId);
    return { tenantId: job.tenantId, jobId: job.jobId };
  }

  async canDispatcherViewJob(jobId, user) {
    const job = await this.assignments.getDispatcherJob(jobId, user);
    return Boolean(
      job &&
      job.jobId === jobId &&
      typeof user.tenantId === 'string' &&
      job.tenantId === user.tenantId
    );
  }

  async deleteExpiredPoints() {
    const cutoff = this.getRetentionCutoff();
    return this.prisma.locationPoint.deleteMany({
      where: { recordedAt: { lt: cutoff } },
    });
  }

  getRetentionCutoff() {
    const cutoff = new Date(this.now());
    cutoff.setTime(cutoff.getTime() - this.retentionDays * 24 * 60 * 60 * 1000);
    return cutoff;
  }

  toTrackingPoint(point) {
    if (!point) return null;
    return {
      jobId: point.jobId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy,
      speed: point.speed,
      heading: point.heading,
      timestamp: new Date(point.recordedAt).toISOString(),
    };
  }
}

export const trackingService = new TrackingService();
