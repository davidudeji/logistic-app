import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RouteOptimizationPanelComponent } from '../../components/route-optimization-panel/route-optimization-panel.component';
import { RouteStopDetail } from '../../models/optimized-route.model';
import { VehicleService } from '../../../../core/services/vehicle.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-route-planning-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouteOptimizationPanelComponent],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">ALM Route Planning & Sequence Optimization</h1>
          <span class="header-subtitle">Multi-stop dispatch planning using Mapbox Optimization API</span>
        </div>
      </div>
      <div class="header-right">
        <a [routerLink]="['/alm/fleet']" class="btn btn-secondary btn-sm">
          Fleet Map
        </a>
      </div>
    </header>

    <main class="page-container">
      <!-- Vehicle and Dispatch Assignment Selector -->
      <div class="panel dispatch-config-panel">
        <div class="panel-header">
          <h3 class="panel-title">Route Parameters & Vehicle Assignment</h3>
        </div>
        <div class="config-grid">
          <div class="form-group">
            <label class="form-label">Assigned Vehicle</label>
            <select class="form-select" [(ngModel)]="selectedAssetId">
              @for (v of vehicleService.vehicles(); track v.id) {
                <option [value]="v.id">{{ v.registrationNumber }} ({{ v.type }} - {{ v.capacity }}kg)</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Departure Depot (Origin)</label>
            <input type="text" class="form-input" value="Lagos Central Distribution Center" readonly />
          </div>

          <div class="form-group">
            <label class="form-label">Final Return Depot (Destination)</label>
            <input type="text" class="form-input" value="Victoria Island Transit Hub" readonly />
          </div>
        </div>
      </div>

      <!-- Stop Sequence Optimization Engine -->
      <app-route-optimization-panel
        [assetId]="selectedAssetId"
        [initialStops]="sampleStops"
        [origin]="[3.3515, 6.6018]"
        [destination]="[3.4219, 6.4281]"
        (routeConfirmed)="onRouteConfirmed($event)"
      ></app-route-optimization-panel>
    </main>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .dispatch-config-panel {
      padding: 16px;
    }

    .config-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 12px;
    }

    @media (max-width: 800px) {
      .config-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class RoutePlanningPageComponent {
  readonly vehicleService = inject(VehicleService);
  private readonly toast = inject(ToastService);

  selectedAssetId = 'VEH-TRK-101';

  readonly sampleStops: RouteStopDetail[] = [
    {
      deliveryId: 'DEL-001',
      sequence: 1,
      recipientName: 'Zenith Industrials Ltd',
      address: '14 Adeola Odeku St, Victoria Island',
      city: 'Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
    },
    {
      deliveryId: 'DEL-002',
      sequence: 2,
      recipientName: 'Afra Pharmaceuticals',
      address: 'Ikeja Pharmaceutical Hub',
      city: 'Lagos',
      latitude: 6.6018,
      longitude: 3.3515,
    },
    {
      deliveryId: 'DEL-003',
      sequence: 3,
      recipientName: 'BrightBuild Supplies',
      address: '55 Sapele Road GRA',
      city: 'Benin City',
      latitude: 6.335,
      longitude: 5.6037,
    },
    {
      deliveryId: 'DEL-004',
      sequence: 4,
      recipientName: 'Port Harcourt Petrolink',
      address: '7 Trans Amadi Layout',
      city: 'Port Harcourt',
      latitude: 4.8396,
      longitude: 7.0174,
    },
  ];

  onRouteConfirmed(routeId: string): void {
    this.toast.success(`Route ${routeId} successfully dispatched and saved to operational database!`);
  }
}
