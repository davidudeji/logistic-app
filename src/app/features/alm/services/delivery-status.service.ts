import { Injectable, inject } from '@angular/core';
import { AlmApiService } from '../data-access/alm-api.service';
import { OfflineSyncService } from './offline-sync.service';
import { Observable, from, of, catchError, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DeliveryStatusService {
  private readonly apiService = inject(AlmApiService);
  private readonly offlineSyncService = inject(OfflineSyncService);

  updateStatus(
    deliveryId: string,
    newStatus: string,
    extra: { notes?: string; receiverName?: string; location?: [number, number] } = {}
  ): Observable<{ success: boolean; queued: boolean; status: string }> {
    const clientMutationId = `mut_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    if (!this.offlineSyncService.isOnline()) {
      return from(
        this.offlineSyncService.queueMutation(deliveryId, newStatus, {
          ...extra,
          clientMutationId,
        })
      ).pipe(
        switchMap(() =>
          of({
            success: true,
            queued: true,
            status: newStatus,
          })
        )
      );
    }

    return this.apiService
      .updateDeliveryStatus(deliveryId, {
        status: newStatus,
        clientMutationId,
        notes: extra.notes,
        receiverName: extra.receiverName,
      })
      .pipe(
        switchMap((res) =>
          of({
            success: res.success,
            queued: false,
            status: res.status,
          })
        ),
        catchError(() => {
          // If network failed midway, enqueue offline
          return from(
            this.offlineSyncService.queueMutation(deliveryId, newStatus, {
              ...extra,
              clientMutationId,
            })
          ).pipe(
            switchMap(() =>
              of({
                success: true,
                queued: true,
                status: newStatus,
              })
            )
          );
        })
      );
  }
}
