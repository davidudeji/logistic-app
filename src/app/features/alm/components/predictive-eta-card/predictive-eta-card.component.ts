import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PredictiveEtaService } from '../../services/predictive-eta.service';

@Component({
  selector: 'app-predictive-eta-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eta-card">
      <div class="eta-card-header">
        <div>
          <span class="card-eyebrow">Traffic-Aware Arrival Estimate</span>
          <h4 class="card-title">{{ destinationAddress }}</h4>
        </div>
        <button
          type="button"
          class="btn-refresh"
          [disabled]="predictiveEtaService.isLoading()"
          (click)="recalculateEta()"
          title="Recalculate Traffic ETA"
        >
          <svg class="refresh-icon" [class.spinning]="predictiveEtaService.isLoading()" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>

      @if (predictiveEtaService.currentEta(); as eta) {
        <div class="eta-main-stat">
          <div class="arrival-time">{{ eta.predictedArrivalTime }}</div>
          <div class="time-remaining">{{ eta.remainingMinutes }} min remaining</div>
        </div>

        <div class="eta-metrics-row">
          <div class="metric-item">
            <span class="m-label">Distance</span>
            <span class="m-value">{{ eta.remainingDistanceKm }} km</span>
          </div>

          <div class="metric-item">
            <span class="m-label">Traffic Impact</span>
            <span class="m-value" [ngClass]="'traffic-' + eta.trafficCondition">
              {{ eta.trafficCondition | uppercase }} ({{ eta.trafficMultiplier }}x)
            </span>
          </div>

          <div class="metric-item">
            <span class="m-label">Reliability</span>
            <span class="m-value">{{ eta.confidenceScore }}%</span>
          </div>
        </div>

        <div class="eta-footer">
          <span class="last-calc">Calculated at {{ eta.lastCalculatedAt }}</span>
          <span class="calc-source">Model: Mapbox Directions + Traffic Factor</span>
        </div>
      } @else {
        <div class="loading-state">
          <span class="mini-spinner"></span>
          <span>Computing predictive ETA...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .eta-card {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .eta-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666666;
    }

    .card-title {
      font-size: 15px;
      margin: 2px 0 0;
      color: #000000;
    }

    .btn-refresh {
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #555555;
    }

    .btn-refresh:hover {
      background: #f0f0f0;
      color: #000000;
    }

    .spinning {
      animation: spin 0.8s linear infinite;
    }

    .eta-main-stat {
      display: flex;
      align-items: baseline;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .arrival-time {
      font-size: 32px;
      font-weight: 400;
      color: #000000;
      line-height: 1;
    }

    .time-remaining {
      font-size: 14px;
      color: #2d6a4f;
      font-weight: 600;
    }

    .eta-metrics-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .m-label {
      font-size: 10px;
      color: #888888;
      text-transform: uppercase;
    }

    .m-value {
      font-size: 13px;
      font-weight: 500;
      color: #000000;
    }

    .traffic-light    { color: #2d6a4f; }
    .traffic-moderate { color: #7c5a00; }
    .traffic-heavy    { color: #7c1f1f; }
    .traffic-severe   { color: #7c1f1f; font-weight: bold; }

    .eta-footer {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #888888;
      border-top: 1px solid #f4f4f5;
      padding-top: 6px;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px;
      justify-content: center;
      font-size: 13px;
      color: #666666;
    }

    .mini-spinner {
      width: 14px;
      height: 14px;
      border: 1.5px solid #000000;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class PredictiveEtaCardComponent implements OnInit {
  readonly predictiveEtaService = inject(PredictiveEtaService);

  @Input() assetId = 'VEH-TRK-101';
  @Input() deliveryId = 'DEL-001';
  @Input() destinationAddress = '14 Adeola Odeku St, Victoria Island';
  @Input() originCoords: [number, number] = [3.3515, 6.6018];
  @Input() destCoords: [number, number] = [3.4219, 6.4281];

  ngOnInit(): void {
    this.recalculateEta();
  }

  recalculateEta(): void {
    this.predictiveEtaService.predictEta(
      {
        assetId: this.assetId,
        deliveryId: this.deliveryId,
        origin: this.originCoords,
        destination: this.destCoords,
        trafficWeight: 1.25,
      },
      this.destinationAddress
    ).subscribe();
  }
}
