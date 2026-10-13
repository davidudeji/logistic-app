import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FleetTelemetryService } from '../../services/fleet-telemetry.service';
import { VehicleTelemetryState } from '../../models/fleet-telemetry.model';

@Component({
  selector: 'app-fleet-live-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #mapElement class="map-canvas"></div>

      <!-- Live Telemetry Status overlay badge -->
      <div class="map-telemetry-badge">
        <span class="live-dot"></span>
        <span class="badge-text">ALM Real-Time Telemetry</span>
        <span class="active-count">{{ fleetTelemetryService.activeVehiclesCount() }} Active</span>
      </div>

      <!-- Map Legend -->
      <div class="map-legend">
        <div class="legend-header">Vehicle Status</div>
        <div class="legend-item">
          <span class="status-marker-dot active-dot"></span> Active ({{ fleetTelemetryService.activeVehiclesCount() }})
        </div>
        <div class="legend-item">
          <span class="status-marker-dot stale-dot"></span> Stale (&gt;5m) ({{ fleetTelemetryService.staleVehiclesCount() }})
        </div>
        <div class="legend-item">
          <span class="status-marker-dot idle-dot"></span> Idle / Stopped
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .map-container {
      position: relative;
      width: 100%;
      height: 480px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      background: #f1f5f9;
    }

    .map-canvas {
      width: 100%;
      height: 100%;
    }

    .map-telemetry-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 500;
      background: rgba(251, 251, 251, 0.95);
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 6px 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 13px;
      color: #000000;
      backdrop-filter: blur(4px);
    }

    .live-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #2d6a4f;
      animation: pulse 1.5s infinite;
    }

    .active-count {
      padding: 1px 6px;
      background: #000000;
      color: #fbfbfb;
      border-radius: 3px;
      font-size: 11px;
    }

    .map-legend {
      position: absolute;
      bottom: 16px;
      right: 16px;
      z-index: 500;
      background: rgba(251, 251, 251, 0.95);
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 10px 14px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12px;
      backdrop-filter: blur(4px);
    }

    .legend-header {
      font-weight: 600;
      margin-bottom: 6px;
      text-transform: uppercase;
      font-size: 10px;
      color: #666666;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .status-marker-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .active-dot { background: #2d6a4f; }
    .stale-dot { background: #7c5a00; }
    .idle-dot { background: #555555; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
  `],
})
export class FleetLiveMapComponent implements OnInit, OnDestroy {
  @ViewChild('mapElement', { static: true }) mapElementRef!: ElementRef<HTMLDivElement>;

  readonly fleetTelemetryService = inject(FleetTelemetryService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private map: any = null;
  private markersMap = new Map<string, any>();
  private leafletModule: any = null;

  constructor() {
    // React to vehicle updates and move/create markers efficiently
    effect(() => {
      const vehicles = this.fleetTelemetryService.vehiclesList();
      if (this.map && this.leafletModule) {
        this.syncMarkers(vehicles);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      this.leafletModule = await import('leaflet');
      const L = this.leafletModule.default || this.leafletModule;

      this.map = L.map(this.mapElementRef.nativeElement, {
        center: [8.5, 7.5], // Center over operations area
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Mapbox ALM Engine',
        maxZoom: 18,
      }).addTo(this.map);

      this.syncMarkers(this.fleetTelemetryService.vehiclesList());
    } catch (e) {
      console.warn('Map initialization failed:', e);
    }
  }

  private syncMarkers(vehicles: VehicleTelemetryState[]): void {
    if (!this.map || !this.leafletModule) return;
    const L = this.leafletModule.default || this.leafletModule;

    const currentIds = new Set<string>();

    for (const v of vehicles) {
      currentIds.add(v.assetId);
      const latLng = [v.latitude, v.longitude];

      const markerColor = v.status === 'active' ? '#2d6a4f' : v.status === 'stale' ? '#7c5a00' : '#000000';
      const customHtml = `
        <div style="background:${markerColor}; color:#fff; border-radius:3px; padding:2px 6px; font-size:10px; font-family:'Times New Roman', serif; font-weight:bold; box-shadow:0 1px 4px rgba(0,0,0,0.3); white-space:nowrap; text-align:center;">
          ${v.registrationNumber}
        </div>
      `;

      const icon = L.divIcon({
        html: customHtml,
        className: 'alm-vehicle-marker',
        iconSize: [60, 22],
        iconAnchor: [30, 11],
      });

      const popupContent = `
        <div style="font-family:'Times New Roman', serif; min-width:180px; padding:4px;">
          <div style="font-weight:bold; font-size:14px; border-bottom:1px solid #eee; padding-bottom:4px; margin-bottom:4px;">
            ${v.registrationNumber} (${v.assetId})
          </div>
          <div style="font-size:12px; margin-bottom:2px;"><strong>Driver:</strong> ${v.driverName || 'Unassigned'}</div>
          <div style="font-size:12px; margin-bottom:2px;"><strong>Speed:</strong> ${v.speedKph} km/h</div>
          <div style="font-size:12px; margin-bottom:2px;"><strong>Status:</strong> ${v.status.toUpperCase()}</div>
          <div style="font-size:11px; color:#666;">Updated: ${new Date(v.lastUpdated).toLocaleTimeString()}</div>
        </div>
      `;

      if (this.markersMap.has(v.assetId)) {
        const marker = this.markersMap.get(v.assetId);
        marker.setLatLng(latLng);
        marker.setIcon(icon);
        marker.getPopup()?.setContent(popupContent);
      } else {
        const marker = L.marker(latLng, { icon }).addTo(this.map).bindPopup(popupContent);
        marker.on('click', () => {
          this.fleetTelemetryService.selectVehicle(v.assetId);
        });
        this.markersMap.set(v.assetId, marker);
      }
    }

    // Clean up markers for removed vehicles
    for (const [id, marker] of this.markersMap.entries()) {
      if (!currentIds.has(id)) {
        marker.remove();
        this.markersMap.delete(id);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.markersMap.clear();
  }
}
