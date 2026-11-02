import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FleetService } from '../../services/fleet';
import { TrackingMapComponent } from '../../features/tracking/tracking-map.component';
import { TrackingMapMarker } from '../../features/tracking/tracking.model';

/**
 * Dashboard map wrapper that reuses the shared Leaflet tracking map.
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, TrackingMapComponent],
  styles: [`
    :host { display: block; }

    .map-wrapper {
      position: relative;
      width: 100%;
      height: 420px;
    }

    .map-el {
      height: 100%;
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      background: #f1f5f9;
    }

    .map-legend {
      position: absolute;
      bottom: 24px;
      right: 16px;
      background: rgba(255,255,255,0.96);
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      z-index: 1000;
      backdrop-filter: blur(6px);
      pointer-events: none;
    }

    .legend-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11.5px;
      color: #334155;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .live-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(255,255,255,0.95);
      border: 1px solid #e2e8f0;
      border-radius: 99px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      color: #0f172a;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 6px;
    }

  `],
  template: `
    <div class="map-wrapper">
      <app-tracking-map
        class="map-el"
        [markers]="markers()"
        [center]="center"
        [zoom]="zoom"
      ></app-tracking-map>

      <div class="live-badge">
        Dispatch snapshot
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-title">Vehicle Status</div>
        @for (entry of legend; track entry.label) {
          <div class="legend-item">
            <div class="legend-dot" [style.background]="entry.color"></div>
            <span>{{ entry.label }}</span>
          </div>
        }
      </div>
    </div>
  `
})
export class MapComponent {
  private readonly fleetService = inject(FleetService);
  private readonly jobs = toSignal(this.fleetService.getJobs(), { initialValue: [] });
  readonly center: [number, number] = [39.8283, -98.5795];
  readonly zoom = 4;

  readonly legend = [
    { color: '#16a34a', label: 'On Time'    },
    { color: '#3b82f6', label: 'Delayed'    },
    { color: '#ef4444', label: 'Critical'   },
    { color: '#f59e0b', label: 'Loading'    },
    { color: '#8b5cf6', label: 'Assigned'   },
    { color: '#6b7280', label: 'Delivered'  },
  ];

  readonly markers = computed<TrackingMapMarker[]>(() =>
    this.jobs().map((job) => ({
      id: job.id,
      kind: 'vehicle',
      latitude: job.lat,
      longitude: job.lng,
      label: job.vehicleId,
      color: this.getStatusColor(job.status),
      popupTitle: job.id,
      popupDetails: [
        `Driver: ${job.driver}`,
        `Route: ${job.origin} to ${job.destination}`,
        `Cargo: ${job.cargo}`,
        `ETA: ${job.eta}`,
        `Status: ${job.status}`,
      ],
    }))
  );

  private getStatusColor(status: string): string {
    const map: Record<string, string> = {
      'On Time':    '#16a34a',
      'Delayed':    '#3b82f6',
      'Critical':   '#ef4444',
      'Loading':    '#f59e0b',
      'Assigned':   '#8b5cf6',
      'Delivered':  '#6b7280',
      'Unassigned': '#94a3b8',
    };
    return map[status] ?? '#94a3b8';
  }
}