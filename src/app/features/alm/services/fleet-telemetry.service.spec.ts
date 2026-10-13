import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { FleetTelemetryService } from './fleet-telemetry.service';
import { SocketConnectionService } from '../../../core/realtime/socket-connection.service';
import { AlmApiService } from '../data-access/alm-api.service';

describe('FleetTelemetryService', () => {
  let service: FleetTelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        FleetTelemetryService,
        SocketConnectionService,
        AlmApiService,
      ],
    });
    service = TestBed.inject(FleetTelemetryService);
  });

  it('should be created and initialize vehicles list', () => {
    expect(service).toBeTruthy();
    expect(service.vehiclesList()).toBeDefined();
  });

  it('should process valid telemetry ping and update vehicle coordinates', () => {
    service.processIncomingPing({
      eventId: 'evt_test_1',
      assetId: 'VEH-TRK-101',
      latitude: 6.789,
      longitude: 3.456,
      heading: 120,
      speedKph: 80,
      telemetryTimestamp: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
    });

    const updated = service.vehiclesList().find((v) => v.assetId === 'VEH-TRK-101');
    expect(updated).toBeDefined();
    expect(updated?.latitude).toBe(6.789);
    expect(updated?.longitude).toBe(3.456);
    expect(updated?.speedKph).toBe(80);
    expect(updated?.status).toBe('active');
  });

  it('should reject location broadcast with invalid coordinates', () => {
    expect(() => {
      service.broadcastDriverLocation({
        assetId: 'VEH-TRK-101',
        latitude: 150, // invalid latitude
        longitude: 3.456,
        telemetryTimestamp: new Date().toISOString(),
      });
    }).toThrowError('Invalid GPS coordinates');
  });
});
