import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  LatLngExpression,
  LayerGroup,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline,
} from 'leaflet';
import { environment } from '../../../environments/environment';
import { TrackingMapMarker } from './tracking.model';

@Component({
  selector: 'app-tracking-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapElement class="tracking-map"></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 240px;
    }

    .tracking-map {
      width: 100%;
      height: 100%;
      min-height: inherit;
      background: #e8eef2;
    }

    :host ::ng-deep .tracking-marker-icon {
      background: transparent;
      border: 0;
    }

    :host ::ng-deep .tracking-marker {
      display: grid;
      width: 32px;
      height: 32px;
      place-items: center;
      border: 2px solid #fff;
      border-radius: 50% 50% 50% 4px;
      background: var(--marker-color, #2563eb);
      box-shadow: 0 2px 6px rgb(15 23 42 / 35%);
      color: #fff;
      font: 700 12px/1 Arial, sans-serif;
      transform: rotate(-45deg);
    }

    :host ::ng-deep .tracking-marker::after {
      transform: rotate(45deg);
    }

    :host ::ng-deep .tracking-marker--vehicle::after { content: 'V'; }
    :host ::ng-deep .tracking-marker--driver::after { content: 'D'; }
    :host ::ng-deep .tracking-marker--pickup::after { content: 'P'; }
    :host ::ng-deep .tracking-marker--dropoff::after { content: 'X'; }
  `],
})
export class TrackingMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: true }) private mapElement!: ElementRef<HTMLDivElement>;

  readonly markers = input<TrackingMapMarker[]>([]);
  readonly routePolyline = input<LatLngExpression[]>([]);
  readonly center = input<[number, number]>([9.082, 8.6753]);
  readonly zoom = input(6);
  readonly markerClick = output<TrackingMapMarker>();

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly zone = inject(NgZone);
  private map: LeafletMap | null = null;
  private leaflet: typeof import('leaflet') | null = null;
  private markerLayer: LayerGroup | null = null;
  private routeLayer: Polyline | null = null;
  private readonly markerInstances = new Map<string, LeafletMarker>();
  private destroyed = false;

  constructor() {
    effect(() => {
      const center = this.center();
      const zoom = this.zoom();
      this.map?.setView(center, zoom);
    });

    effect(() => {
      this.markers();
      this.routePolyline();
      this.syncLayers();
    });
  }

  async ngAfterViewInit(): Promise<void> {
    if (!this.isBrowser) return;

    this.leaflet = await import('leaflet');
    if (this.destroyed) return;

    const L = this.leaflet;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
    });

    this.map = L.map(this.mapElement.nativeElement, {
      center: this.center(),
      zoom: this.zoom(),
      zoomControl: true,
    });

    L.tileLayer(environment.trackingMap.tileUrl, {
      attribution: environment.trackingMap.attribution,
      maxZoom: environment.trackingMap.maxZoom,
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.syncLayers();
    this.map.invalidateSize();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.markerInstances.clear();
    this.markerLayer = null;
    this.routeLayer = null;
    this.map?.remove();
    this.map = null;
  }

  private syncLayers(): void {
    if (!this.map || !this.leaflet || !this.markerLayer) return;

    this.syncMarkers();
    this.syncRoute();
  }

  private syncMarkers(): void {
    const L = this.leaflet!;
    const markers = this.markers();
    const currentIds = new Set(markers.map((marker) => marker.id));

    for (const markerData of markers) {
      const position: LatLngExpression = [markerData.latitude, markerData.longitude];
      const existing = this.markerInstances.get(markerData.id);

      if (existing) {
        existing.setLatLng(position);
        existing.setIcon(this.createIcon(markerData));
        existing.getPopup()?.setContent(this.createPopup(markerData));
        continue;
      }

      const marker = L.marker(position, { icon: this.createIcon(markerData) })
        .bindPopup(this.createPopup(markerData))
        .on('click', () => this.zone.run(() => this.markerClick.emit(markerData)))
        .addTo(this.markerLayer!);
      this.markerInstances.set(markerData.id, marker);
    }

    for (const [id, marker] of this.markerInstances) {
      if (!currentIds.has(id)) {
        marker.remove();
        this.markerInstances.delete(id);
      }
    }
  }

  private syncRoute(): void {
    if (!this.leaflet || !this.map) return;

    this.routeLayer?.remove();
    const points = this.routePolyline();
    if (points.length > 1) {
      this.routeLayer = this.leaflet.polyline(points, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.8,
      }).addTo(this.map);
    } else {
      this.routeLayer = null;
    }
  }

  private createIcon(marker: TrackingMapMarker): import('leaflet').DivIcon {
    const kind = marker.kind;
    const element = document.createElement('span');
    element.className = `tracking-marker tracking-marker--${kind}`;
    if (marker.color && /^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(marker.color)) {
      element.style.setProperty('--marker-color', marker.color);
    }

    return this.leaflet!.divIcon({
      className: 'tracking-marker-icon',
      html: element,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -30],
    });
  }

  private createPopup(marker: TrackingMapMarker): HTMLElement {
    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = marker.popupTitle || marker.label;
    popup.append(title);

    for (const detail of marker.popupDetails ?? []) {
      const line = document.createElement('div');
      line.textContent = detail;
      popup.append(line);
    }

    return popup;
  }
}
