class DeliveryRepository {
  constructor() {
    this.deliveries = new Map();
    this.clientMutationIdIndex = new Set();
    this.seedDeliveries();
  }

  seedDeliveries() {
    const seed = [
      {
        id: 'DEL-001',
        orderId: 'ORD-1001',
        driverId: 'DRV-001',
        assetId: 'VEH-TRK-101',
        status: 'OUT_FOR_DELIVERY',
        recipientName: 'Zenith Industrials Ltd',
        address: '14 Adeola Odeku St, VI, Lagos',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'DEL-002',
        orderId: 'ORD-1002',
        driverId: 'DRV-002',
        assetId: 'VEH-VAN-201',
        status: 'OUT_FOR_DELIVERY',
        recipientName: 'Afra Pharmaceuticals',
        address: '3 Independence Ave, Abuja',
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'DEL-003',
        orderId: 'ORD-1003',
        driverId: 'DRV-004',
        assetId: 'VEH-TRK-102',
        status: 'PENDING',
        recipientName: 'Kano Grains Cooperative',
        address: '21 Kofar Wambai Market, Kano',
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const d of seed) {
      this.deliveries.set(d.id, d);
    }
  }

  getById(id) {
    return this.deliveries.get(id) || null;
  }

  hasClientMutationId(clientMutationId) {
    return this.clientMutationIdIndex.has(clientMutationId);
  }

  recordClientMutationId(clientMutationId) {
    this.clientMutationIdIndex.add(clientMutationId);
  }

  updateStatus(id, newStatus, extra = {}) {
    const current = this.getById(id) || { id, status: 'PENDING' };
    const updated = {
      ...current,
      ...extra,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    this.deliveries.set(id, updated);
    return updated;
  }
}

export const deliveryRepository = new DeliveryRepository();
