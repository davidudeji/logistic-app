import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  ActiveTrackingJob,
  TrackingPoint,
  isActiveTrackingJob,
  isTrackingPoint,
} from '../../features/tracking/tracking.model';
import { environment } from '../../../environments/environment';
import { TRACKING_TRANSPORT } from './tracking-transport';

@Injectable({ providedIn: 'root' })
export class DispatcherTrackingService {
  private readonly http = inject(HttpClient);
  private readonly transport = inject(TRACKING_TRANSPORT);
  private readonly positionSubscriptions = new Map<string, Subscription>();
  private activeRequestId = 0;
  private historyRequestId = 0;

  readonly activeJobs = signal<ActiveTrackingJob[]>([]);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly history = signal<TrackingPoint[]>([]);
  readonly historyJobId = signal<string | null>(null);
  readonly historyLoading = signal(false);
  readonly historyError = signal<string | null>(null);

  constructor() {
    this.transport.errors$?.subscribe((error) => {
      this.errorMessage.set(`Live updates failed for job ${error.jobId}: ${error.message}`);
    });
  }

  refreshActiveJobs(): void {
    const requestId = ++this.activeRequestId;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.http.get<unknown>(`${environment.apiBaseUrl}/tracking/active`).subscribe({
      next: (response) => {
        if (requestId !== this.activeRequestId) return;
        if (!Array.isArray(response) || !response.every(isActiveTrackingJob)) {
          this.errorMessage.set('The tracking API returned an invalid active-jobs response.');
          this.isLoading.set(false);
          return;
        }

        const latestByJob = new Map(
          this.activeJobs().map((job) => [job.jobId, job.latestPosition] as const)
        );
        const jobs = (response as ActiveTrackingJob[]).map((job) => {
          const currentPosition = latestByJob.get(job.jobId);
          if (
            currentPosition &&
            (!job.latestPosition ||
              Date.parse(currentPosition.timestamp) > Date.parse(job.latestPosition.timestamp))
          ) {
            return { ...job, latestPosition: currentPosition };
          }
          return job;
        });

        this.activeJobs.set(jobs);
        this.updatePositionSubscriptions(jobs);
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        if (requestId !== this.activeRequestId) return;
        this.errorMessage.set(
          error instanceof Error ? error.message : 'Could not load active tracking jobs.'
        );
        this.isLoading.set(false);
      },
    });
  }

  loadHistory(jobId: string): void {
    const normalizedJobId = jobId.trim();
    if (!normalizedJobId) {
      this.historyRequestId++;
      this.history.set([]);
      this.historyJobId.set(null);
      this.historyLoading.set(false);
      this.historyError.set('Enter a job ID to load its trip history.');
      return;
    }

    const requestId = ++this.historyRequestId;
    this.historyJobId.set(normalizedJobId);
    this.history.set([]);
    this.historyError.set(null);
    this.historyLoading.set(true);

    this.http
      .get<unknown>(
        `${environment.apiBaseUrl}/tracking/${encodeURIComponent(normalizedJobId)}/history`
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.historyRequestId) return;
          if (
            !Array.isArray(response) ||
            !response.every(
              (point) => isTrackingPoint(point) && point.jobId === normalizedJobId
            )
          ) {
            this.historyError.set('The tracking API returned invalid trip history.');
            this.historyLoading.set(false);
            return;
          }

          this.history.set(
            [...(response as TrackingPoint[])].sort(
              (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
            )
          );
          this.historyLoading.set(false);
        },
        error: (error: unknown) => {
          if (requestId !== this.historyRequestId) return;
          this.historyError.set(
            error instanceof Error ? error.message : 'Could not load trip history.'
          );
          this.historyLoading.set(false);
        },
      });
  }

  disconnect(): void {
    this.activeRequestId++;
    this.historyRequestId++;
    this.isLoading.set(false);
    this.historyLoading.set(false);
    this.positionSubscriptions.forEach((subscription) => subscription.unsubscribe());
    this.positionSubscriptions.clear();
    this.transport.disconnect();
  }

  private updatePositionSubscriptions(jobs: ActiveTrackingJob[]): void {
    const jobIds = new Set(jobs.map((job) => job.jobId));

    for (const [jobId, subscription] of this.positionSubscriptions) {
      if (!jobIds.has(jobId)) {
        subscription.unsubscribe();
        this.positionSubscriptions.delete(jobId);
        this.transport.disconnect(jobId);
      }
    }

    for (const job of jobs) {
      if (this.positionSubscriptions.has(job.jobId)) continue;

      const subscription = this.transport.positions$(job.jobId).subscribe({
        next: (point) => this.updateLivePosition(job.jobId, point),
        error: (error: unknown) => {
          this.positionSubscriptions.delete(job.jobId);
          this.transport.disconnect(job.jobId);
          this.errorMessage.set(
            error instanceof Error ? error.message : `Live updates failed for job ${job.jobId}.`
          );
        },
      });

      this.positionSubscriptions.set(job.jobId, subscription);
      try {
        this.transport.connect(job.jobId);
      } catch (error) {
        subscription.unsubscribe();
        this.positionSubscriptions.delete(job.jobId);
        this.errorMessage.set(
          error instanceof Error ? error.message : `Could not connect to job ${job.jobId}.`
        );
      }
    }
  }

  private updateLivePosition(jobId: string, point: TrackingPoint): void {
    if (!isTrackingPoint(point) || point.jobId !== jobId) {
      this.errorMessage.set(`Received an invalid live position for job ${jobId}.`);
      return;
    }

    this.activeJobs.update((jobs) =>
      jobs.map((job) => {
        if (job.jobId !== jobId) return job;
        const current = job.latestPosition;
        if (current && Date.parse(point.timestamp) < Date.parse(current.timestamp)) return job;
        return { ...job, latestPosition: point };
      })
    );
    this.errorMessage.set(null);
  }
}
