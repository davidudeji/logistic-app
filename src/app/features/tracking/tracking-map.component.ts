import { Component, inject, OnDestroy, AfterViewInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { TrackingService } from '../../core/services/tracking.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Live Tracking</h1>
          <span class="header-subtitle">Real-time vehicle positions</span>
        </div>
        <div class="live-indicator">
          <span class="live-dot"></span>
          Updating every 5s
        </div>
      </div>
    </header>
    <main style="flex:1;display:flex;flex-direction:column;overflow:hidden;padding:0;">
      <div #mapContainer style="flex:1;width:100%;min-height:0;"></div>
    </main>
  `,
})
export class TrackingMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private map: any;
  private markers: Map<string, any> = new Map();
  private sub?: Subscription;

  private trackingService = inject(TrackingService);
  private vehicleService  = inject(VehicleService);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initMap();
    this.startTracking();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.map) { this.map.remove(); this.map = null; }
  }

  private async initMap(): Promise<void> {
    const L = await import('leaflet');
    this.map = L.map(this.mapContainer.nativeElement, { center: [9.0820, 8.6753], zoom: 6 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
    }).addTo(this.map);
    this.map.invalidateSize();
  }

  private async startTracking(): Promise<void> {
    const L = await import('leaflet');
    this.sub = this.trackingService.vehiclePositions$.subscribe(positions => {
      positions.forEach(pos => {
        const vehicle = this.vehicleService.vehicles().find(v => v.id === pos.vehicleId);
        const label   = vehicle?.registrationNumber ?? pos.vehicleId;
        const icon    = L.divIcon({
          className: '',
          html: `<div class="fleet-marker on-time" style="width:38px;height:38px;font-size:8px;">${label}</div>`,
          iconSize: [38, 38], iconAnchor: [19, 19], popupAnchor: [0, -22],
        });
        if (this.markers.has(pos.vehicleId)) {
          this.markers.get(pos.vehicleId).setLatLng([pos.latitude, pos.longitude]);
        } else {
          const marker = L.marker([pos.latitude, pos.longitude], { icon })
            .bindPopup(`<b>${label}</b><br>Speed: ${Math.round(pos.speed)} km/h`);
          marker.addTo(this.map);
          this.markers.set(pos.vehicleId, marker);
        }
      });
    });
  }
}
