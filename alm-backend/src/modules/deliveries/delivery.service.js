import { deliveryRepository } from './delivery.repository.js';

export class DeliveryService {
  updateDeliveryStatus(deliveryId, data, authenticatedUser = null) {
    const { status, clientMutationId, notes, receiverName } = data;

    if (!status) {
      throw new Error('status is required.');
    }

    // Idempotency safeguard: if clientMutationId was already processed, return current state safely
    if (clientMutationId && deliveryRepository.hasClientMutationId(clientMutationId)) {
      const existing = deliveryRepository.getById(deliveryId);
      return {
        success: true,
        deliveryId,
        status: existing?.status || status,
        updatedAt: existing?.updatedAt || new Date().toISOString(),
        idempotentReplay: true,
      };
    }

    if (clientMutationId) {
      deliveryRepository.recordClientMutationId(clientMutationId);
    }

    const updated = deliveryRepository.updateStatus(deliveryId, status, {
      notes,
      receiverName,
      lastUpdatedBy: authenticatedUser?.id,
    });

    return {
      success: true,
      deliveryId: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  getDeliveryById(id) {
    return deliveryRepository.getById(id);
  }
}

export const deliveryService = new DeliveryService();
