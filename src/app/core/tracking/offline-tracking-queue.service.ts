import { Injectable } from '@angular/core';
import { TrackingPoint } from '../../features/tracking/tracking.model';

const DATABASE_NAME = 'logistic-tracking';
const DATABASE_VERSION = 1;
const STORE_NAME = 'points';
const MAX_POINT_AGE_MS = 24 * 60 * 60 * 1000;

export interface QueuedTrackingPoint extends TrackingPoint {
  id: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineTrackingQueueService {
  private databasePromise: Promise<IDBDatabase> | null = null;

  async enqueue(point: TrackingPoint): Promise<void> {
    await this.pruneExpired();
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).add(point);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not queue tracking point.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Tracking queue write was aborted.'));
    });
  }

  async getOldestBatch(jobId: string, limit: number): Promise<QueuedTrackingPoint[]> {
    const database = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      let batch: QueuedTrackingPoint[] = [];

      request.onsuccess = () => {
        const now = Date.now();
        const points = request.result as QueuedTrackingPoint[];

        for (const point of points) {
          const recordedAt = Date.parse(point.timestamp);
          if (!Number.isFinite(recordedAt) || now - recordedAt > MAX_POINT_AGE_MS) {
            store.delete(point.id);
          }
        }

        batch = points
          .filter((point) => {
            const recordedAt = Date.parse(point.timestamp);
            return (
              point.jobId === jobId &&
              Number.isFinite(recordedAt) &&
              now - recordedAt <= MAX_POINT_AGE_MS
            );
          })
          .sort((left, right) => {
            const timeDifference = Date.parse(left.timestamp) - Date.parse(right.timestamp);
            return timeDifference || left.id - right.id;
          })
          .slice(0, limit);
      };

      request.onerror = () =>
        reject(request.error ?? new Error('Could not read queued tracking points.'));
      transaction.oncomplete = () => resolve(batch);
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Could not load queued tracking points.'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Tracking queue read was aborted.'));
    });
  }

  async remove(ids: number[]): Promise<void> {
    if (!ids.length) return;

    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      ids.forEach((id) => store.delete(id));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not clear sent tracking points.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Tracking queue cleanup was aborted.'));
    });
  }

  async count(jobId: string): Promise<number> {
    await this.pruneExpired();
    const database = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const request = transaction.objectStore(STORE_NAME).getAll();

      request.onsuccess = () => {
        const now = Date.now();
        resolve(
          (request.result as TrackingPoint[]).filter(
            (point) =>
              point.jobId === jobId &&
              Number.isFinite(Date.parse(point.timestamp)) &&
              now - Date.parse(point.timestamp) <= MAX_POINT_AGE_MS
          ).length
        );
      };
      request.onerror = () =>
        reject(request.error ?? new Error('Could not count queued tracking points.'));
    });
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('Offline tracking requires IndexedDB in this browser.'));
    }
    if (this.databasePromise) return this.databasePromise;

    this.databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => {
        this.databasePromise = null;
        reject(request.error ?? new Error('Could not open offline tracking storage.'));
      };
      request.onblocked = () => {
        this.databasePromise = null;
        reject(new Error('Offline tracking storage is blocked by another tab.'));
      };
    });

    return this.databasePromise;
  }

  private async pruneExpired(): Promise<void> {
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = Date.now();
        for (const point of request.result as QueuedTrackingPoint[]) {
          const recordedAt = Date.parse(point.timestamp);
          if (!Number.isFinite(recordedAt) || now - recordedAt > MAX_POINT_AGE_MS) {
            store.delete(point.id);
          }
        }
      };
      request.onerror = () =>
        reject(request.error ?? new Error('Could not discard expired tracking points.'));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error('Could not discard expired tracking points.'));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Tracking queue pruning was aborted.'));
    });
  }
}
