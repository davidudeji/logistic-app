import { Injectable, inject, PLATFORM_ID, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AlmApiService } from '../data-access/alm-api.service';
import {
  OfflineDeliveryMutation,
  SyncDeliveryResponse,
} from '../models/offline-sync.model';

const DB_NAME = 'alm_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'delivery_mutations';

export type SyncState =
  | 'online'
  | 'offline'
  | 'pending'
  | 'synchronizing'
  | 'synchronized'
  | 'failed'
  | 'manual_review_required';

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly apiService = inject(AlmApiService);

  readonly isOnline = signal<boolean>(this.isBrowser ? navigator.onLine : true);
  readonly syncState = signal<SyncState>('online');
  readonly queue = signal<OfflineDeliveryMutation[]>([]);
  readonly pendingCount = computed(() => this.queue().filter((m) => m.syncState !== 'confirmed').length);
  readonly lastSyncTimestamp = signal<string | null>(null);
  readonly lastError = signal<string | null>(null);

  private db: IDBDatabase | null = null;

  constructor() {
    if (this.isBrowser) {
      this.initIndexedDb();
      this.initNetworkListeners();
    }
  }

  private initNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      if (this.pendingCount() > 0) {
        this.syncState.set('pending');
        this.synchronizeQueue();
      } else {
        this.syncState.set('online');
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.syncState.set('offline');
    });
  }

  private initIndexedDb(): Promise<void> {
    return new Promise((resolve) => {
      if (!window.indexedDB) {
        this.loadFromFallback();
        resolve();
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('clientMutationId', 'clientMutationId', { unique: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        this.loadQueueFromDb();
        resolve();
      };

      request.onerror = () => {
        this.loadFromFallback();
        resolve();
      };
    });
  }

  private loadQueueFromDb(): void {
    if (!this.db) {
      this.loadFromFallback();
      return;
    }

    try {
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items: OfflineDeliveryMutation[] = req.result || [];
        this.queue.set(items);
        if (items.length > 0) {
          this.syncState.set(this.isOnline() ? 'pending' : 'offline');
        }
      };
    } catch {
      this.loadFromFallback();
    }
  }

  private loadFromFallback(): void {
    try {
      const stored = localStorage.getItem('alm_offline_queue');
      if (stored) {
        const items = JSON.parse(stored);
        this.queue.set(items);
      }
    } catch {}
  }

  private saveToFallback(items: OfflineDeliveryMutation[]): void {
    try {
      localStorage.setItem('alm_offline_queue', JSON.stringify(items));
    } catch {}
  }

  /**
   * Adds a status update mutation to the durable offline queue
   */
  async queueMutation(
    deliveryId: string,
    status: string,
    payload: Record<string, unknown> = {}
  ): Promise<OfflineDeliveryMutation> {
    const mutation: OfflineDeliveryMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      deliveryId,
      clientMutationId: `cmid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      status,
      createdAt: new Date().toISOString(),
      payload,
      attempts: 0,
      syncState: 'queued',
    };

    const nextQueue = [...this.queue(), mutation];
    this.queue.set(nextQueue);
    this.saveToFallback(nextQueue);

    if (this.db) {
      try {
        const tx = this.db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(mutation);
      } catch {}
    }

    if (this.isOnline()) {
      this.syncState.set('pending');
      // Synchronize immediately if connected
      this.synchronizeQueue();
    } else {
      this.syncState.set('offline');
    }

    return mutation;
  }

  /**
   * Replays and synchronizes all pending mutations
   */
  async synchronizeQueue(): Promise<SyncDeliveryResponse | null> {
    const pending = this.queue().filter((m) => m.syncState !== 'confirmed');
    if (pending.length === 0) {
      this.syncState.set(this.isOnline() ? 'synchronized' : 'offline');
      return null;
    }

    if (!this.isOnline()) {
      this.syncState.set('offline');
      return null;
    }

    this.syncState.set('synchronizing');

    return new Promise((resolve) => {
      this.apiService.syncOfflineMutations({ mutations: pending }).subscribe({
        next: (response) => {
          this.lastSyncTimestamp.set(new Date().toLocaleTimeString());
          this.lastError.set(null);

          // Update items based on results
          const currentQueue = this.queue();
          const confirmedIds = new Set<string>();

          for (const res of response.results) {
            if (res.success) {
              confirmedIds.add(res.clientMutationId);
            }
          }

          // Remove confirmed mutations from DB and state
          const remaining = currentQueue.filter(
            (m) => !confirmedIds.has(m.clientMutationId)
          );
          this.queue.set(remaining);
          this.saveToFallback(remaining);

          if (this.db) {
            try {
              const tx = this.db.transaction(STORE_NAME, 'readwrite');
              const store = tx.objectStore(STORE_NAME);
              for (const m of currentQueue) {
                if (confirmedIds.has(m.clientMutationId)) {
                  store.delete(m.id);
                }
              }
            } catch {}
          }

          if (remaining.length === 0) {
            this.syncState.set('synchronized');
          } else {
            this.syncState.set('failed');
          }

          resolve(response);
        },
        error: (err) => {
          this.syncState.set('failed');
          this.lastError.set(err.message || 'Sync failed.');
          resolve(null);
        },
      });
    });
  }

  retrySync(): void {
    this.synchronizeQueue();
  }
}
