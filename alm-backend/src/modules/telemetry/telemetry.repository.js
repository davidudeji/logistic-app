class TelemetryRepository {
  constructor() {
    // Current latest state per asset
    this.latestStateByAsset = new Map();
    // Historical log bounded to last 100 entries per asset
    this.historyByAsset = new Map();

    this.seedInitialTelemetry();
  }

  seedInitialTelemetry() {
    const seed = [
      {
        assetId: 'VEH-TRK-101',
        registrationNumber: 'TRK-101',
        driverId: 'DRV-001',
        driverName: 'John Okafor',
        longitude: 3.3515,
        latitude: 6.6018,
        speedKph: 62,
        heading: 45,
        telemetryTimestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        eventId: 'evt_init_101',
        status: 'active',
      },
      {
        assetId: 'VEH-VAN-201',
        registrationNumber: 'VAN-201',
        driverId: 'DRV-002',
        driverName: 'Sarah Williams',
        longitude: 7.498,
        latitude: 9.062,
        speedKph: 88,
        heading: 20,
        telemetryTimestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        eventId: 'evt_init_201',
        status: 'active',
      },
      {
        assetId: 'VEH-TRK-102',
        registrationNumber: 'TRK-102',
        driverId: 'DRV-004',
        driverName: 'Ngozi Eze',
        longitude: 8.54,
        latitude: 11.97,
        speedKph: 0,
        heading: 0,
        telemetryTimestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        eventId: 'evt_init_102',
        status: 'idle',
      },
      {
        assetId: 'VEH-VAN-202',
        registrationNumber: 'VAN-202',
        driverId: 'DRV-006',
        driverName: 'Amina Bello',
        longitude: 7.04,
        latitude: 4.815,
        speedKph: 55,
        heading: 180,
        telemetryTimestamp: new Date().toISOString(),
        receivedAt: new Date().toISOString(),
        eventId: 'evt_init_202',
        status: 'active',
      },
    ];

    for (const item of seed) {
      this.saveTelemetry(item);
    }
  }

  saveTelemetry(record) {
    this.latestStateByAsset.set(record.assetId, record);

    const history = this.historyByAsset.get(record.assetId) || [];
    history.unshift(record);
    if (history.length > 100) history.pop();
    this.historyByAsset.set(record.assetId, history);

    return record;
  }

  getLatestAll() {
    return Array.from(this.latestStateByAsset.values());
  }

  getHistory(assetId) {
    return this.historyByAsset.get(assetId) || [];
  }

  getLatestByAsset(assetId) {
    return this.latestStateByAsset.get(assetId) || null;
  }
}

export const telemetryRepository = new TelemetryRepository();
