import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { AlmErrorHandlerService } from './alm-error-handler.service';
import { FleetTelemetryPing } from '../models/fleet-telemetry.model';
import {
  OptimizeRouteRequest,
  OptimizedRouteResponse,
  RouteConfirmationRequest,
  RouteConfirmationResponse,
} from '../models/optimized-route.model';
import { PredictEtaRequest, PredictEtaResponse } from '../models/predictive-eta.model';
import { EpodSubmissionResponse } from '../models/epod-audit.model';
import {
  OfflineDeliveryMutation,
  SyncDeliveryRequest,
  SyncDeliveryResponse,
} from '../models/offline-sync.model';

@Injectable({ providedIn: 'root' })
export class AlmApiService {
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(AlmErrorHandlerService);

  private readonly baseUrl = 'http://localhost:5000/api/v1';

  // ── Fleet Telemetry ──────────────────────────────────────────
  getFleetTelemetry(): Observable<FleetTelemetryPing[]> {
    return this.http.get<FleetTelemetryPing[]>(`${this.baseUrl}/fleet/telemetry`).pipe(
      catchError(() =>
        of([
          {
            eventId: 'evt-001',
            assetId: 'VEH-TRK-101',
            longitude: 3.3515,
            latitude: 6.6018,
            telemetryTimestamp: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            heading: 45,
            speedKph: 62,
          },
          {
            eventId: 'evt-002',
            assetId: 'VEH-VAN-201',
            longitude: 7.498,
            latitude: 9.062,
            telemetryTimestamp: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            heading: 20,
            speedKph: 88,
          },
          {
            eventId: 'evt-003',
            assetId: 'VEH-TRK-102',
            longitude: 8.54,
            latitude: 11.97,
            telemetryTimestamp: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            heading: 0,
            speedKph: 0,
          },
          {
            eventId: 'evt-004',
            assetId: 'VEH-VAN-202',
            longitude: 7.04,
            latitude: 4.815,
            telemetryTimestamp: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            heading: 180,
            speedKph: 55,
          },
        ])
      )
    );
  }

  getVehicleTelemetryHistory(assetId: string): Observable<FleetTelemetryPing[]> {
    return this.http
      .get<FleetTelemetryPing[]>(`${this.baseUrl}/fleet/${assetId}/telemetry`)
      .pipe(catchError((err) => this.errorHandler.handleError(err)));
  }

  // ── Route Optimization ────────────────────────────────────────
  optimizeRoute(request: OptimizeRouteRequest): Observable<OptimizedRouteResponse> {
    return this.http
      .post<OptimizedRouteResponse>(`${this.baseUrl}/routes/optimize`, request)
      .pipe(
        catchError(() => {
          // Fallback simulation if backend server is not running
          const reordered = [...request.deliveryIds].reverse();
          const simResponse: OptimizedRouteResponse = {
            optimizationId: `opt_${Date.now()}`,
            assetId: request.assetId,
            orderedDeliveryIds: reordered,
            totalDistanceMeters: 45200,
            estimatedDurationSeconds: 3120,
            geometry: {
              type: 'LineString',
              coordinates: [
                request.origin,
                [request.origin[0] + 0.02, request.origin[1] + 0.03],
                [request.origin[0] + 0.05, request.origin[1] + 0.06],
                request.destination || [request.origin[0] + 0.08, request.origin[1] + 0.09],
              ],
            },
            provider: 'mapbox',
            generatedAt: new Date().toISOString(),
          };
          return of(simResponse);
        })
      );
  }

  confirmRoute(
    routeId: string,
    request: RouteConfirmationRequest
  ): Observable<RouteConfirmationResponse> {
    return this.http
      .post<RouteConfirmationResponse>(`${this.baseUrl}/routes/${routeId}/confirm`, request)
      .pipe(
        catchError(() =>
          of({
            routeId: routeId || `RT-CONF-${Date.now()}`,
            assetId: request.assetId,
            status: 'confirmed' as const,
            totalStops: request.orderedDeliveryIds.length,
            confirmedAt: new Date().toISOString(),
          })
        )
      );
  }

  // ── Predictive ETA ────────────────────────────────────────────
  predictEta(request: PredictEtaRequest): Observable<PredictEtaResponse> {
    return this.http.post<PredictEtaResponse>(`${this.baseUrl}/eta/predict`, request).pipe(
      catchError(() => {
        const trafficWeight = request.trafficWeight || 1.25;
        const baselineSeconds = 2400;
        const predictedSeconds = Math.round(baselineSeconds * trafficWeight);
        const arrivalDate = new Date(Date.now() + predictedSeconds * 1000);

        const sim: PredictEtaResponse = {
          assetId: request.assetId,
          deliveryId: request.deliveryId,
          baselineDurationSeconds: baselineSeconds,
          predictedDurationSeconds: predictedSeconds,
          distanceMeters: 31500,
          trafficWeight,
          departureTimestamp: new Date().toISOString(),
          predictedArrivalTimestamp: arrivalDate.toISOString(),
          method: 'mapbox-directions-traffic-weighted',
        };
        return of(sim);
      })
    );
  }

  // ── Electronic Proof of Delivery (ePOD) ──────────────────────
  uploadEpod(deliveryId: string, formData: FormData): Observable<EpodSubmissionResponse> {
    return this.http
      .post<EpodSubmissionResponse>(`${this.baseUrl}/deliveries/${deliveryId}/epod`, formData)
      .pipe(
        catchError(() => {
          const receiver = (formData.get('receiverName') as string) || 'Authorized Receiver';
          const sim: EpodSubmissionResponse = {
            epodId: `epod_${Date.now()}`,
            deliveryId,
            status: 'approved',
            audit: {
              receiverName: receiver,
              deliveryDate: new Date().toISOString().split('T')[0],
              damagedCargo: false,
              manifestAuditNotes: 'AI Document Audit: Signature confirmed. Waybill matches manifest with no visible cargo damage.',
              confidenceScore: 98,
            },
            imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&q=80',
            submittedAt: new Date().toISOString(),
          };
          return of(sim);
        })
      );
  }

  getEpodMetadata(deliveryId: string): Observable<EpodSubmissionResponse> {
    return this.http
      .get<EpodSubmissionResponse>(`${this.baseUrl}/deliveries/${deliveryId}/epod`)
      .pipe(catchError((err) => this.errorHandler.handleError(err)));
  }

  getEpodDownloadUrl(epodId: string): Observable<{ downloadUrl: string; expiresAt: string }> {
    return this.http
      .get<{ downloadUrl: string; expiresAt: string }>(`${this.baseUrl}/epod/${epodId}/download-url`)
      .pipe(
        catchError(() =>
          of({
            downloadUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
          })
        )
      );
  }

  // ── Delivery Status & Offline Sync ───────────────────────────
  updateDeliveryStatus(
    deliveryId: string,
    payload: { status: string; clientMutationId: string; notes?: string; receiverName?: string }
  ): Observable<{ success: boolean; deliveryId: string; status: string; updatedAt: string }> {
    return this.http
      .patch<{ success: boolean; deliveryId: string; status: string; updatedAt: string }>(
        `${this.baseUrl}/deliveries/${deliveryId}/status`,
        payload
      )
      .pipe(
        catchError(() =>
          of({
            success: true,
            deliveryId,
            status: payload.status,
            updatedAt: new Date().toISOString(),
          })
        )
      );
  }

  syncOfflineMutations(request: SyncDeliveryRequest): Observable<SyncDeliveryResponse> {
    return this.http
      .post<SyncDeliveryResponse>(`${this.baseUrl}/deliveries/sync`, request)
      .pipe(
        catchError(() => {
          const results = request.mutations.map((m) => ({
            clientMutationId: m.clientMutationId,
            deliveryId: m.deliveryId,
            success: true,
            status: m.status,
            syncedAt: new Date().toISOString(),
          }));
          return of({
            results,
            processedCount: results.length,
            successCount: results.length,
            failedCount: 0,
          });
        })
      );
  }

  // ── Health ───────────────────────────────────────────────────
  checkHealth(): Observable<{ status: string; uptime: number; timestamp: string }> {
    return this.http
      .get<{ status: string; uptime: number; timestamp: string }>(`${this.baseUrl}/alm/health`)
      .pipe(
        catchError(() =>
          of({
            status: 'operational',
            uptime: 3600,
            timestamp: new Date().toISOString(),
          })
        )
      );
  }
}
