import { Injectable, inject, signal } from '@angular/core';
import { AlmApiService } from '../data-access/alm-api.service';
import {
  OptimizeRouteRequest,
  OptimizedRouteResponse,
  RouteStopDetail,
  RouteConfirmationRequest,
  RouteConfirmationResponse,
} from '../models/optimized-route.model';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class RouteOptimizationService {
  private readonly apiService = inject(AlmApiService);

  readonly isOptimizing = signal<boolean>(false);
  readonly currentOptimization = signal<OptimizedRouteResponse | null>(null);
  readonly proposedStops = signal<RouteStopDetail[]>([]);
  readonly confirmedRoute = signal<RouteConfirmationResponse | null>(null);
  readonly errorState = signal<string | null>(null);

  optimizeRoute(request: OptimizeRouteRequest, initialStops: RouteStopDetail[]): Observable<OptimizedRouteResponse> {
    this.isOptimizing.set(true);
    this.errorState.set(null);

    return this.apiService.optimizeRoute(request).pipe(
      tap({
        next: (response) => {
          this.isOptimizing.set(false);
          this.currentOptimization.set(response);

          // Map back to original stop models in the new optimized order
          const ordered = response.orderedDeliveryIds
            .map((delId, index) => {
              const stop = initialStops.find((s) => s.deliveryId === delId);
              if (!stop) return null;
              return {
                ...stop,
                sequence: index + 1,
              };
            })
            .filter((s): s is RouteStopDetail => s !== null);

          this.proposedStops.set(ordered);
        },
        error: (err) => {
          this.isOptimizing.set(false);
          this.errorState.set(err.message || 'Route optimization failed.');
        },
      })
    );
  }

  confirmRoute(routeId: string, req: RouteConfirmationRequest): Observable<RouteConfirmationResponse> {
    return this.apiService.confirmRoute(routeId, req).pipe(
      tap((res) => {
        this.confirmedRoute.set(res);
      })
    );
  }

  clear(): void {
    this.currentOptimization.set(null);
    this.proposedStops.set([]);
    this.confirmedRoute.set(null);
    this.errorState.set(null);
  }
}
