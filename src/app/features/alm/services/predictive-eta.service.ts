import { Injectable, inject, signal } from '@angular/core';
import { AlmApiService } from '../data-access/alm-api.service';
import { PredictEtaRequest, PredictEtaResponse, EtaDisplayCardData } from '../models/predictive-eta.model';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PredictiveEtaService {
  private readonly apiService = inject(AlmApiService);

  private readonly cache = new Map<string, { data: PredictEtaResponse; cachedAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  readonly currentEta = signal<EtaDisplayCardData | null>(null);
  readonly isLoading = signal<boolean>(false);

  predictEta(
    request: PredictEtaRequest,
    destinationAddress: string = 'Destination Stop'
  ): Observable<PredictEtaResponse> {
    const cacheKey = `${request.assetId}_${request.deliveryId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.cachedAt < this.CACHE_TTL_MS) {
      this.updateDisplayCard(cached.data, destinationAddress);
      return new Observable((sub) => {
        sub.next(cached.data);
        sub.complete();
      });
    }

    this.isLoading.set(true);

    return this.apiService.predictEta(request).pipe(
      tap({
        next: (response) => {
          this.isLoading.set(false);
          this.cache.set(cacheKey, { data: response, cachedAt: Date.now() });
          this.updateDisplayCard(response, destinationAddress);
        },
        error: () => {
          this.isLoading.set(false);
        },
      })
    );
  }

  private updateDisplayCard(res: PredictEtaResponse, destinationAddress: string): void {
    const remainingMinutes = Math.round(res.predictedDurationSeconds / 60);
    const remainingKm = Math.round((res.distanceMeters / 1000) * 10) / 10;

    let trafficCondition: EtaDisplayCardData['trafficCondition'] = 'light';
    if (res.trafficWeight >= 1.5) trafficCondition = 'severe';
    else if (res.trafficWeight >= 1.3) trafficCondition = 'heavy';
    else if (res.trafficWeight >= 1.15) trafficCondition = 'moderate';

    const confidenceScore = Math.min(98, Math.max(70, Math.round(100 - (res.trafficWeight - 1) * 40)));

    this.currentEta.set({
      deliveryId: res.deliveryId,
      assetId: res.assetId,
      destinationAddress,
      predictedArrivalTime: new Date(res.predictedArrivalTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      remainingMinutes,
      remainingDistanceKm: remainingKm,
      trafficCondition,
      trafficMultiplier: res.trafficWeight,
      confidenceScore,
      lastCalculatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }
}
