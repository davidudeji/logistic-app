import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TrackingMapComponent } from './tracking-map.component';
import { ActiveTrackingJob, TrackingMapMarker, TrackingPoint } from './tracking.model';
import { DispatcherTrackingService } from '../../core/tracking/dispatcher-tracking.service';

const STALE_AFTER_MS = 2 * 60 * 1000;

@Component({
  selector: 'app-dispatcher-tracking',
  standalone: true,
  imports: [CommonModule, TrackingMapComponent],
  template: `
    <header class="top-header">
      <div class="header-left">
        <div class="header-title-group">
          <h1 class="header-title">Live Tracking</h1>
          <span class="header-subtitle">Active vehicles and trip status</span>
        </div>
      </div>
      <div class="header-right">
        <span class="active-count">{{ tracking.activeJobs().length }} active jobs</span>
        <button class="btn btn-sm btn-secondary" type="button" (click)="refresh()">
          Refresh
        </button>
      </div>
    </header>

    <main class="dispatcher-page">
      @if (tracking.errorMessage()) {
        <div class="error-banner" role="alert">{{ tracking.errorMessage() }}</div>
      }

      <div class="dispatcher-layout">
        <aside class="job-sidebar" aria-label="Active jobs">
          <div class="sidebar-heading">
            <h2>Active jobs</h2>
            @if (tracking.isLoading()) { <span>Updating…</span> }
          </div>

          <div class="job-list">
            @for (job of tracking.activeJobs(); track job.jobId) {
              <button
                type="button"
                class="job-card"
                [class.selected]="selectedJobId() === job.jobId"
                [class.stale]="isStale(job)"
                (click)="focusJob(job.jobId)"
              >
                <span class="job-card-heading">
                  <span class="vehicle-name">{{ job.vehicleRegistration }}</span>
                  <span class="job-status" [style.color]="statusColor(job)">
                    {{ displayStatus(job) }}
                  </span>
                </span>
                <span class="job-card-detail">{{ job.driverFirstName }} · {{ job.jobId }}</span>
                <span class="last-seen">{{ lastSeen(job.latestPosition) }}</span>
              </button>
            } @empty {
              @if (!tracking.isLoading()) {
                <div class="empty-state">No active jobs are reporting tracking data.</div>
              }
            }
          </div>

          <section class="history-search" aria-labelledby="history-title">
            <h2 id="history-title">Trip history</h2>
            <p>Replay a completed job by its ID.</p>
            <form (submit)="loadHistory($event, historyJobInput)">
              <label for="history-job-id">Job ID</label>
              <input
                #historyJobInput
                id="history-job-id"
                name="jobId"
                type="text"
                autocomplete="off"
                placeholder="Enter job ID"
              />
              <button
                class="btn btn-secondary"
                type="submit"
                [disabled]="tracking.historyLoading()"
              >
                {{ tracking.historyLoading() ? 'Loading…' : 'Load replay' }}
              </button>
            </form>
            @if (tracking.historyError()) {
              <div class="history-error" role="alert">{{ tracking.historyError() }}</div>
            }
            @if (tracking.historyJobId() && !tracking.historyLoading() && !tracking.historyError() && tracking.history().length === 0) {
              <div class="history-empty">No location history found for this job.</div>
            }
          </section>
        </aside>

        <section class="map-panel" aria-label="Vehicle map">
          <app-tracking-map
            [markers]="markers()"
            [routePolyline]="routePolyline()"
            [center]="center()"
            [zoom]="zoom()"
            (markerClick)="selectMarker($event)"
          ></app-tracking-map>
          <div class="map-status">
            <span class="map-status-dot"></span>
            {{ tracking.activeJobs().length }} active vehicles
            <span class="map-attribution-note">Map data © OpenStreetMap contributors</span>
          </div>
        </section>
      </div>

      @if (tracking.history().length > 0) {
        <section class="replay-panel" aria-label="Trip history replay">
          <div class="replay-heading">
            <div>
              <h2>Replay · {{ tracking.historyJobId() }}</h2>
              <p>{{ tracking.history().length }} recorded location points</p>
            </div>
            <time>{{ replayPoint()?.timestamp | date:'medium' }}</time>
          </div>
          <input
            class="replay-slider"
            aria-label="Trip replay timeline"
            type="range"
            min="0"
            [max]="tracking.history().length - 1"
            [value]="replayIndex()"
            [disabled]="tracking.history().length < 2"
            (input)="setReplayIndex($event)"
          />
          <div class="replay-endpoints">
            <span>{{ tracking.history()[0].timestamp | date:'shortTime' }}</span>
            <span>{{ tracking.history()[tracking.history().length - 1].timestamp | date:'shortTime' }}</span>
          </div>
        </section>
      }
    </main>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100%; }

    .dispatcher-page { padding: 16px; }

    .dispatcher-layout {
      display: grid;
      grid-template-columns: minmax(270px, 340px) minmax(0, 1fr);
      gap: 16px;
      min-height: 580px;
    }

    .job-sidebar, .map-panel, .replay-panel {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
    }

    .job-sidebar {
      display: flex;
      flex-direction: column;
      min-height: 580px;
      overflow: hidden;
    }

    .sidebar-heading, .replay-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .sidebar-heading h2, .history-search h2, .replay-heading h2 {
      margin: 0;
      font-size: 15px;
    }

    .sidebar-heading > span { color: #64748b; font-size: 12px; }

    .job-list {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
      overflow: auto;
      padding: 10px;
    }

    .job-card {
      display: grid;
      gap: 7px;
      width: 100%;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      color: #0f172a;
      text-align: left;
      cursor: pointer;
    }

    .job-card:hover, .job-card.selected { border-color: #2563eb; background: #eff6ff; }
    .job-card.stale { border-color: #fca5a5; }
    .job-card-heading { display: flex; justify-content: space-between; gap: 8px; }
    .vehicle-name { font-weight: 700; }
    .job-status { font-size: 12px; font-weight: 700; text-transform: capitalize; }
    .job-card-detail, .last-seen { color: #64748b; font-size: 12px; }
    .last-seen { color: #334155; }
    .job-card.stale .last-seen { color: #b91c1c; font-weight: 600; }

    .empty-state, .history-empty { padding: 18px 12px; color: #64748b; font-size: 13px; }

    .history-search {
      padding: 14px;
      border-top: 1px solid #e5e7eb;
    }

    .history-search p { margin: 5px 0 12px; color: #64748b; font-size: 12px; }
    .history-search form { display: grid; gap: 8px; }
    .history-search label { color: #475569; font-size: 12px; }
    .history-search input {
      min-width: 0;
      height: 40px;
      padding: 0 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .history-search button { min-height: 40px; justify-content: center; }
    .history-error, .error-banner { padding: 10px 12px; border-radius: 6px; background: #fef2f2; color: #991b1b; }
    .history-error { margin-top: 10px; font-size: 12px; }
    .error-banner { margin-bottom: 12px; }

    .map-panel {
      position: relative;
      min-height: 580px;
      overflow: hidden;
    }

    .map-panel app-tracking-map { display: block; width: 100%; height: 100%; min-height: 580px; }

    .map-status {
      position: absolute;
      z-index: 500;
      top: 12px;
      left: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      background: rgb(255 255 255 / 95%);
      color: #334155;
      font-size: 12px;
    }

    .map-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; }
    .map-attribution-note { color: #64748b; }

    .replay-panel { margin-top: 16px; padding-bottom: 12px; }
    .replay-heading { border-bottom: 0; }
    .replay-heading p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
    .replay-heading time { color: #334155; font-size: 13px; }
    .replay-slider { display: block; width: calc(100% - 32px); margin: 0 16px; }
    .replay-endpoints { display: flex; justify-content: space-between; padding: 4px 16px 0; color: #64748b; font-size: 11px; }

    @media (max-width: 920px) {
      .dispatcher-layout { grid-template-columns: 1fr; }
      .job-sidebar { min-height: 300px; max-height: 420px; }
      .map-panel { min-height: 480px; }
      .map-panel app-tracking-map { min-height: 480px; }
    }

    @media (max-width: 540px) {
      .dispatcher-page { padding: 10px; }
      .map-attribution-note { display: none; }
      .replay-heading { align-items: flex-start; flex-direction: column; }
    }
  `],
})
export class DispatcherTrackingComponent implements OnInit, OnDestroy {
  readonly tracking = inject(DispatcherTrackingService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly currentTime = signal(Date.now());
  readonly selectedJobId = signal<string | null>(null);
  readonly replayIndex = signal(0);

  private clockTimer: number | null = null;
  private refreshTimer: number | null = null;

  readonly replayPoint = computed(() => {
    const points = this.tracking.history();
    return points[Math.min(this.replayIndex(), Math.max(points.length - 1, 0))] ?? null;
  });

  readonly markers = computed<TrackingMapMarker[]>(() => {
    const replay = this.replayPoint();
    if (replay) {
      return [{
        id: `replay-${replay.jobId}`,
        kind: 'driver',
        latitude: replay.lat,
        longitude: replay.lng,
        label: 'Trip replay',
        color: '#7c3aed',
        popupTitle: `Replay · ${replay.jobId}`,
        popupDetails: [`Recorded: ${new Date(replay.timestamp).toLocaleString()}`],
      }];
    }

    return this.tracking.activeJobs().flatMap((job) => {
      const position = job.latestPosition;
      if (!position) return [];

      return [{
        id: job.jobId,
        kind: 'vehicle' as const,
        latitude: position.lat,
        longitude: position.lng,
        label: job.vehicleRegistration,
        color: this.statusColor(job),
        popupTitle: job.vehicleRegistration,
        popupDetails: [
          `Driver: ${job.driverFirstName}`,
          `Job: ${job.jobId}`,
          `Status: ${this.displayStatus(job)}`,
          this.lastSeen(position),
        ],
      }];
    });
  });

  readonly routePolyline = computed(() =>
    this.tracking.history().map((point) => [point.lat, point.lng] as [number, number])
  );

  readonly center = computed<[number, number]>(() => {
    const replay = this.replayPoint();
    if (replay) return [replay.lat, replay.lng];

    const selected = this.tracking.activeJobs().find(
      (job) => job.jobId === this.selectedJobId()
    );
    if (selected?.latestPosition) {
      return [selected.latestPosition.lat, selected.latestPosition.lng];
    }
    return [9.082, 8.6753];
  });

  readonly zoom = computed(() =>
    this.replayPoint() || this.selectedPosition() ? 13 : 6
  );

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.tracking.refreshActiveJobs();
    this.clockTimer = window.setInterval(() => this.currentTime.set(Date.now()), 1_000);
    this.refreshTimer = window.setInterval(() => this.tracking.refreshActiveJobs(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer !== null) window.clearInterval(this.clockTimer);
    if (this.refreshTimer !== null) window.clearInterval(this.refreshTimer);
    this.tracking.disconnect();
  }

  refresh(): void {
    this.tracking.refreshActiveJobs();
  }

  focusJob(jobId: string): void {
    this.selectedJobId.set(jobId);
  }

  selectMarker(marker: TrackingMapMarker): void {
    if (this.tracking.activeJobs().some((job) => job.jobId === marker.id)) {
      this.focusJob(marker.id);
    }
  }

  isStale(job: ActiveTrackingJob): boolean {
    if (!job.latestPosition) return true;
    return this.currentTime() - Date.parse(job.latestPosition.timestamp) >= STALE_AFTER_MS;
  }

  lastSeen(point: TrackingPoint | null): string {
    if (!point) return 'No GPS position yet';
    const seconds = Math.max(0, Math.floor((this.currentTime() - Date.parse(point.timestamp)) / 1000));
    return `Last seen ${seconds} second${seconds === 1 ? '' : 's'} ago`;
  }

  displayStatus(job: ActiveTrackingJob): string {
    return this.isStale(job) ? 'Stale' : job.status.replace('_', ' ');
  }

  statusColor(job: ActiveTrackingJob): string {
    if (this.isStale(job)) return '#b91c1c';
    return {
      assigned: '#7c3aed',
      in_transit: '#2563eb',
      arrived: '#d97706',
      delivered: '#16a34a',
    }[job.status];
  }

  loadHistory(event: SubmitEvent, input: HTMLInputElement): void {
    event.preventDefault();
    this.replayIndex.set(0);
    this.tracking.loadHistory(input.value);
  }

  setReplayIndex(event: Event): void {
    if (!(event.currentTarget instanceof HTMLInputElement)) return;
    this.replayIndex.set(Number(event.currentTarget.value));
  }

  private selectedPosition(): TrackingPoint | null {
    const selected = this.tracking.activeJobs().find(
      (job) => job.jobId === this.selectedJobId()
    );
    return selected?.latestPosition ?? null;
  }
}
