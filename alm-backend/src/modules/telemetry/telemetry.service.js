import crypto from 'node:crypto';
import { telemetryRepository } from './telemetry.repository.js';

export class TelemetryService {
  validateAndIngestBroadcast(data, authenticatedUser = null) {
    if (!data.assetId || typeof data.assetId !== 'string') {
      throw new Error('assetId is required and must be a string.');
    }

    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      throw new Error('longitude must be a valid number between -180 and 180.');
    }

    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      throw new Error('latitude must be a valid number between -90 and 90.');
    }

    const telemetryTime = new Date(data.telemetryTimestamp).getTime();
    if (isNaN(telemetryTime)) {
      throw new Error('telemetryTimestamp is missing or invalid.');
    }

    // Check future drift (max 10 minutes)
    if (telemetryTime > Date.now() + 600000) {
      throw new Error('telemetryTimestamp cannot be more than 10 minutes in the future.');
    }

    // Speed check
    if (data.speedKph !== undefined && (typeof data.speedKph !== 'number' || data.speedKph < 0 || data.speedKph > 250)) {
      throw new Error('speedKph must be between 0 and 250 km/h.');
    }

    // Heading check
    if (data.heading !== undefined && (typeof data.heading !== 'number' || data.heading < 0 || data.heading > 360)) {
      throw new Error('heading must be between 0 and 360 degrees.');
    }

    // Check for replay attacks against latest recorded time
    const existing = telemetryRepository.getLatestByAsset(data.assetId);
    if (existing) {
      const existingTime = new Date(existing.telemetryTimestamp).getTime();
      if (telemetryTime < existingTime) {
        throw new Error('Stale telemetry packet rejected: timestamp older than current recorded position.');
      }
    }

    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const receivedAt = new Date().toISOString();

    const record = {
      eventId,
      assetId: data.assetId,
      driverId: authenticatedUser?.id || data.driverId || existing?.driverId,
      driverName: existing?.driverName || 'Driver',
      registrationNumber: existing?.registrationNumber || data.assetId,
      longitude: data.longitude,
      latitude: data.latitude,
      heading: data.heading ?? 0,
      speedKph: data.speedKph ?? 0,
      telemetryTimestamp: data.telemetryTimestamp,
      receivedAt,
      status: (data.speedKph || 0) > 0 ? 'active' : 'idle',
    };

    telemetryRepository.saveTelemetry(record);

    return {
      eventId,
      assetId: record.assetId,
      longitude: record.longitude,
      latitude: record.latitude,
      telemetryTimestamp: record.telemetryTimestamp,
      receivedAt,
      heading: record.heading,
      speedKph: record.speedKph,
    };
  }

  getFleetTelemetry() {
    return telemetryRepository.getLatestAll();
  }

  getVehicleHistory(assetId) {
    return telemetryRepository.getHistory(assetId);
  }
}

export const telemetryService = new TelemetryService();
