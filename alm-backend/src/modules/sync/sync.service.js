import { deliveryService } from '../deliveries/delivery.service.js';

export class SyncService {
  processBatchSync(mutations, authenticatedUser = null) {
    if (!Array.isArray(mutations)) {
      throw new Error('mutations must be an array.');
    }

    const results = [];
    let successCount = 0;
    let failedCount = 0;

    for (const m of mutations) {
      try {
        const updateResult = deliveryService.updateDeliveryStatus(
          m.deliveryId,
          {
            status: m.status,
            clientMutationId: m.clientMutationId,
            notes: m.payload?.notes,
            receiverName: m.payload?.receiverName,
          },
          authenticatedUser
        );

        results.push({
          clientMutationId: m.clientMutationId,
          deliveryId: m.deliveryId,
          success: true,
          status: updateResult.status,
          syncedAt: new Date().toISOString(),
        });
        successCount++;
      } catch (err) {
        results.push({
          clientMutationId: m.clientMutationId,
          deliveryId: m.deliveryId,
          success: false,
          status: m.status,
          errorCode: 'MUTATION_FAILED',
          errorMessage: err.message,
        });
        failedCount++;
      }
    }

    return {
      results,
      processedCount: mutations.length,
      successCount,
      failedCount,
    };
  }
}

export const syncService = new SyncService();
