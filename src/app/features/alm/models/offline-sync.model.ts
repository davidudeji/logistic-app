export interface OfflineDeliveryMutation {
  id: string;
  deliveryId: string;
  clientMutationId: string;
  status: string; // e.g. 'OUT_FOR_DELIVERY' | 'ARRIVED' | 'DELIVERED' | 'FAILED'
  createdAt: string;
  payload: {
    receiverName?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
    failureReason?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  syncState?: 'queued' | 'syncing' | 'confirmed' | 'failed';
}

export interface SyncDeliveryRequest {
  mutations: OfflineDeliveryMutation[];
}

export interface SyncItemResult {
  clientMutationId: string;
  deliveryId: string;
  success: boolean;
  status: string;
  syncedAt?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SyncDeliveryResponse {
  results: SyncItemResult[];
  processedCount: number;
  successCount: number;
  failedCount: number;
}
