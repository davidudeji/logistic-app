import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouteOptimizationService } from '../../services/route-optimization.service';
import { RouteStopDetail } from '../../models/optimized-route.model';

@Component({
  selector: 'app-route-optimization-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="opt-panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Route Sequence Optimization</h3>
          <span class="panel-subtitle">Powered by Mapbox Optimization API</span>
        </div>
        @if (routeOptimizationService.confirmedRoute()) {
          <span class="badge badge-success">Route Confirmed</span>
        } @else if (routeOptimizationService.currentOptimization()) {
          <span class="badge badge-warning">Proposed (Pending Confirmation)</span>
        }
      </div>

      <div class="stops-comparison-grid">
        <!-- Before Optimization Sequence -->
        <div class="sequence-column">
          <div class="column-title">Original Sequence</div>
          <div class="stops-list">
            @for (s of initialStops; track s.deliveryId; let idx = $index) {
              <div class="stop-item">
                <span class="stop-badge">{{ idx + 1 }}</span>
                <div class="stop-info">
                  <div class="stop-name">{{ s.recipientName }}</div>
                  <div class="stop-address">{{ s.address }}, {{ s.city }}</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- After Optimization Sequence -->
        <div class="sequence-column">
          <div class="column-title">Optimized Sequence</div>
          @if (routeOptimizationService.proposedStops().length > 0) {
            <div class="stops-list">
              @for (s of routeOptimizationService.proposedStops(); track s.deliveryId; let idx = $index) {
                <div class="stop-item optimized-item">
                  <span class="stop-badge opt-badge">{{ idx + 1 }}</span>
                  <div class="stop-info">
                    <div class="stop-name">{{ s.recipientName }}</div>
                    <div class="stop-address">{{ s.address }}, {{ s.city }}</div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <span class="empty-text">Click "Optimize Route" to compute the sequence via Mapbox.</span>
            </div>
          }
        </div>
      </div>

      <!-- Metrics and Savings Summary -->
      @if (routeOptimizationService.currentOptimization(); as opt) {
        <div class="metrics-summary">
          <div class="metric-box">
            <span class="metric-label">Total Distance</span>
            <span class="metric-val">{{ (opt.totalDistanceMeters / 1000).toFixed(1) }} km</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Estimated Drive Time</span>
            <span class="metric-val">{{ Math.round(opt.estimatedDurationSeconds / 60) }} mins</span>
          </div>
          <div class="metric-box">
            <span class="metric-label">Stops Optimized</span>
            <span class="metric-val">{{ opt.orderedDeliveryIds.length }} stops</span>
          </div>
        </div>
      }

      <!-- Actions -->
      <div class="panel-actions">
        <button
          type="button"
          class="btn btn-secondary"
          [disabled]="routeOptimizationService.isOptimizing()"
          (click)="onOptimizeClick()"
        >
          @if (routeOptimizationService.isOptimizing()) {
            Computing Optimization...
          } @else {
            Run Optimization
          }
        </button>

        @if (routeOptimizationService.currentOptimization() && !routeOptimizationService.confirmedRoute()) {
          <button
            type="button"
            class="btn btn-primary"
            (click)="onConfirmClick()"
          >
            Confirm & Dispatch Route
          </button>
        }
      </div>

      @if (routeOptimizationService.errorState(); as err) {
        <div class="error-notice">
          {{ err }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .opt-panel {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }

    .panel-title {
      font-size: 16px;
      margin: 0;
      color: #000000;
    }

    .panel-subtitle {
      font-size: 12px;
      color: #777777;
    }

    .stops-comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .sequence-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .column-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #555555;
    }

    .stops-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .stop-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      background: #ffffff;
    }

    .optimized-item {
      border-color: #2d6a4f;
      background: rgba(45, 106, 79, 0.03);
    }

    .stop-badge {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #000000;
      color: #ffffff;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .opt-badge {
      background: #2d6a4f;
    }

    .stop-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .stop-name {
      font-size: 13px;
      font-weight: 600;
      color: #000000;
    }

    .stop-address {
      font-size: 11px;
      color: #666666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .empty-state {
      padding: 24px;
      border: 1px dashed #d1d5db;
      border-radius: 4px;
      text-align: center;
    }

    .empty-text {
      font-size: 12px;
      color: #888888;
    }

    .metrics-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding: 10px;
      background: #f4f4f5;
      border-radius: 4px;
    }

    .metric-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .metric-label { font-size: 10px; color: #666666; text-transform: uppercase; }
    .metric-val { font-size: 15px; font-weight: 600; color: #000000; }

    .panel-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .error-notice {
      padding: 8px 12px;
      border: 1px solid #7c1f1f;
      background: rgba(124, 31, 31, 0.05);
      color: #7c1f1f;
      border-radius: 4px;
      font-size: 12px;
    }

    @media (max-width: 700px) {
      .stops-comparison-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class RouteOptimizationPanelComponent {
  readonly routeOptimizationService = inject(RouteOptimizationService);
  readonly Math = Math;

  @Input() assetId = 'VEH-TRK-101';
  @Input() initialStops: RouteStopDetail[] = [];
  @Input() origin: [number, number] = [3.3515, 6.6018];
  @Input() destination?: [number, number] = [3.4219, 6.4281];

  @Output() routeConfirmed = new EventEmitter<string>();

  onOptimizeClick(): void {
    const deliveryIds = this.initialStops.map((s) => s.deliveryId);
    this.routeOptimizationService.optimizeRoute(
      {
        assetId: this.assetId,
        deliveryIds,
        origin: this.origin,
        destination: this.destination,
      },
      this.initialStops
    ).subscribe();
  }

  onConfirmClick(): void {
    const current = this.routeOptimizationService.currentOptimization();
    if (!current) return;

    this.routeOptimizationService.confirmRoute(current.optimizationId, {
      optimizationId: current.optimizationId,
      assetId: current.assetId,
      orderedDeliveryIds: current.orderedDeliveryIds,
    }).subscribe({
      next: (res) => {
        this.routeConfirmed.emit(res.routeId);
      },
    });
  }
}
