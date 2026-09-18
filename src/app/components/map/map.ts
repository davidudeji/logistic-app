import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FleetService, DispatchJob } from '../../services/fleet';

/**
 * MapComponent — SSR-safe Leaflet integration.
 *
 * LeafletModule is NOT statically imported because Leaflet reads `window`
 * at module initialisation time, which crashes Node during SSR.
 * Instead we use a plain <div> + ViewChild and dynamically import Leaflet
 * only when running in the browser (guarded by isPlatformBrowser).
 */
@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
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

    .live-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse-dot 2s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.5; transform: scale(1.3); }
    }
  `],
  template: `
    <div class="map-wrapper">
      <!-- Plain div — Leaflet attaches here via ViewChild -->
      <div #mapContainer class="map-el"></div>

      <!-- Live Badge -->
      <div class="live-badge">
        <span class="live-dot"></span>
        Live
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
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map: any;

  readonly legend = [
    { color: '#16a34a', label: 'On Time'    },
    { color: '#3b82f6', label: 'Delayed'    },
    { color: '#ef4444', label: 'Critical'   },
    { color: '#f59e0b', label: 'Loading'    },
    { color: '#8b5cf6', label: 'Assigned'   },
    { color: '#6b7280', label: 'Delivered'  },
  ];

  constructor(
    private fleetService: FleetService,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  async ngAfterViewInit(): Promise<void> {
    // Only initialise Leaflet in the browser — Node has no `window`
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async initMap(): Promise<void> {
    const L = await import('leaflet');

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(this.map);

    this.map.invalidateSize();
    this.plotFleetMarkers(L);
  }

  private plotFleetMarkers(L: any): void {
    this.fleetService.getJobs().subscribe((jobs: DispatchJob[]) => {
      jobs.forEach(job => {
        const color    = this.getStatusColor(job.status);
        const cssClass = this.getStatusClass(job.status);
        const size     = 40;

        const icon = L.divIcon({
          className: '',
          html: `<div class="fleet-marker ${cssClass}" style="width:${size}px;height:${size}px;">${job.vehicleId}</div>`,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor:[0, -(size / 2 + 4)],
        });

        const marker = L.marker([job.lat, job.lng], { icon });

        marker.bindPopup(`
          <div style="font-family:'Inter',sans-serif;min-width:190px;padding:4px 0;">
            <p style="font-weight:700;font-size:13px;color:#0f172a;margin-bottom:6px;
                      border-bottom:1px solid #f1f5f9;padding-bottom:6px;">
              ${job.id}
            </p>
            <p style="font-size:11px;color:#64748b;margin-bottom:3px;">
              <b style="color:#334155">Driver:</b> ${job.driver}
            </p>
            <p style="font-size:11px;color:#64748b;margin-bottom:3px;">
              <b style="color:#334155">Route:</b> ${job.origin} → ${job.destination}
            </p>
            <p style="font-size:11px;color:#64748b;margin-bottom:3px;">
              <b style="color:#334155">Cargo:</b> ${job.cargo}
            </p>
            <p style="font-size:11px;color:#64748b;margin-bottom:6px;">
              <b style="color:#334155">ETA:</b> ${job.eta}
            </p>
            <span style="display:inline-block;padding:2px 8px;border-radius:99px;
                         background:${color}20;color:${color};font-size:10px;font-weight:700;">
              ${job.status}
            </span>
          </div>
        `, { maxWidth: 240 });

        marker.addTo(this.map);
      });
    });
  }

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

  private getStatusClass(status: string): string {
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}