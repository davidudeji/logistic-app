import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { SocketConnectionService } from '../../../core/realtime/socket-connection.service';
import { AlmApiService } from '../data-access/alm-api.service';
import {
  DriverLocationBroadcast,
  FleetTelemetryPing,
  VehicleTelemetryState,
} from '../models/fleet-telemetry.model';
import { VehicleService } from '../../../core/services/vehicle.service';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

@Injectable({ providedIn: 'root' })
export class FleetTelemetryService {
  private readonly socketService = inject(SocketConnectionService);
  private readonly apiService = inject(AlmApiService);
  private readonly vehicleService = inject(VehicleService);

  private readonly vehiclesMap = signal<Map<string, VehicleTelemetryState>>(new Map());

  readonly vehiclesList = computed(() => Array.from(this.vehiclesMap().values()));
  readonly activeVehiclesCount = computed(
    () => this.vehiclesList().filter((v) => v.status === 'active').length
  );
  readonly staleVehiclesCount = computed(
    () => this.vehiclesList().filter((v) => v.status === 'stale').length
  );

  readonly selectedAssetId = signal<string | null>(null);
  readonly selectedVehicle = computed(() => {
    const id = this.selectedAssetId();
    if (!id) return this.vehiclesList()[0] ?? null;
    return this.vehiclesMap().get(id) ?? null;
  });

  constructor() {
    this.initSnapshot();
    this.listenToTelemetryPings();

    // Check for stale vehicles every 30 seconds
    if (typeof window !== 'undefined') {
      window.setInterval(() => this.markStaleVehicles(), 30000);
    }
  }

  private initSnapshot(): void {
    // Populate initial vehicle positions from API or vehicleService
    this.apiService.getFleetTelemetry().subscribe({
      next: (pings) => {
        const nextMap = new Map<string, VehicleTelemetryState>();

        // Seed with existing vehicles from vehicle service
        for (const v of this.vehicleService.vehicles()) {
          const lat = v.currentLocation?.latitude ?? 6.5244;
          const lng = v.currentLocation?.longitude ?? 3.3792;
          nextMap.set(v.id, {
            assetId: v.id,
            registrationNumber: v.registrationNumber,
            driverName: v.currentDriverId ?? 'Assigned Driver',
            driverId: v.currentDriverId,
            longitude: lng,
            latitude: lat,
            heading: 0,
            speedKph: 0,
            lastUpdated: new Date().toISOString(),
            status: v.status === 'IN_TRANSIT' ? 'active' : 'idle',
            assignedRouteId: 'RT-001',
          });
        }

        // Apply incoming telemetry pings
        for (const ping of pings) {
          if (this.isValidTelemetry(ping)) {
            const existing = nextMap.get(ping.assetId);
            nextMap.set(ping.assetId, {
              assetId: ping.assetId,
              registrationNumber: existing?.registrationNumber || ping.assetId,
              driverName: existing?.driverName,
              driverId: existing?.driverId,
              longitude: ping.longitude,
              latitude: ping.latitude,
              heading: ping.heading ?? existing?.heading ?? 0,
              speedKph: ping.speedKph ?? existing?.speedKph ?? 0,
              lastUpdated: ping.telemetryTimestamp,
              status: this.isStale(ping.telemetryTimestamp) ? 'stale' : 'active',
            });
          }
        }

        this.vehiclesMap.set(nextMap);
      },
    });
  }

  private listenToTelemetryPings(): void {
    this.socketService.on<FleetTelemetryPing>('fleet_telemetry_ping').subscribe({
      next: (ping) => {
        this.processIncomingPing(ping);
      },
    });
  }

  processIncomingPing(ping: FleetTelemetryPing): void {
    if (!this.isValidTelemetry(ping)) {
      console.warn('Rejected invalid telemetry payload:', ping);
      return;
    }

    const map = new Map(this.vehiclesMap());
    const existing = map.get(ping.assetId);

    const updated: VehicleTelemetryState = {
      assetId: ping.assetId,
      registrationNumber: existing?.registrationNumber || ping.assetId,
      driverName: existing?.driverName,
      driverId: existing?.driverId,
      longitude: ping.longitude,
      latitude: ping.latitude,
      heading: ping.heading ?? existing?.heading ?? 0,
      speedKph: ping.speedKph ?? existing?.speedKph ?? 0,
      lastUpdated: ping.telemetryTimestamp,
      status: this.isStale(ping.telemetryTimestamp) ? 'stale' : 'active',
      assignedRouteId: existing?.assignedRouteId,
      assignedOrderId: existing?.assignedOrderId,
      assignedDestination: existing?.assignedDestination,
    };

    map.set(ping.assetId, updated);
    this.vehiclesMap.set(map);
  }

  /**
   * Broadcast driver location to the backend
   */
  broadcastDriverLocation(data: DriverLocationBroadcast): void {
    if (!this.isValidCoordinates(data.longitude, data.latitude)) {
      throw new Error('Invalid GPS coordinates');
    }

    // Emit event over socket
    this.socketService.emit('driver_location_broadcast', data);

    // Also update locally for instantaneous UI reflection
    this.processIncomingPing({
      eventId: `sim_evt_${Date.now()}`,
      assetId: data.assetId,
      longitude: data.longitude,
      latitude: data.latitude,
      telemetryTimestamp: data.telemetryTimestamp,
      receivedAt: new Date().toISOString(),
      heading: data.heading,
      speedKph: data.speedKph,
    });
  }

  selectVehicle(assetId: string): void {
    this.selectedAssetId.set(assetId);
  }

  private markStaleVehicles(): void {
    const map = new Map(this.vehiclesMap());
    let modified = false;

    for (const [id, vehicle] of map.entries()) {
      if (this.isStale(vehicle.lastUpdated) && vehicle.status === 'active') {
        map.set(id, { ...vehicle, status: 'stale' });
        modified = true;
      }
    }

    if (modified) {
      this.vehiclesMap.set(map);
    }
  }

  private isStale(isoTimestamp: string): boolean {
    const diff = Date.now() - new Date(isoTimestamp).getTime();
    return diff > STALE_THRESHOLD_MS;
  }

  private isValidTelemetry(ping: FleetTelemetryPing): boolean {
    if (!ping.assetId || typeof ping.assetId !== 'string') return false;
    if (!this.isValidCoordinates(ping.longitude, ping.latitude)) return false;

    const time = new Date(ping.telemetryTimestamp).getTime();
    if (isNaN(time)) return false;

    // Check not > 10 minutes in the future
    if (time > Date.now() + 600000) return false;

    return true;
  }

  private isValidCoordinates(lng: number, lat: number): boolean {
    return (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      !isNaN(lng) &&
      !isNaN(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }
}
