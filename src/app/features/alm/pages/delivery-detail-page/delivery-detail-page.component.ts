import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DeliveryTimelineComponent } from '../../components/delivery-timeline/delivery-timeline.component';
import { PredictiveEtaCardComponent } from '../../components/predictive-eta-card/predictive-eta-card.component';
import { EpodUploadComponent } from '../../components/epod-upload/epod-upload.component';
import { EpodAuditPanelComponent } from '../../components/epod-audit-panel/epod-audit-panel.component';
import { OfflineSyncIndicatorComponent } from '../../components/offline-sync-indicator/offline-sync-indicator.component';
import { DeliveryStatusService } from '../../services/delivery-status.service';
import { AlmDeliveryDetail, AlmDeliveryStatus } from '../../models/delivery.model';
import { EpodSubmissionResponse } from '../../models/epod-audit.model';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-delivery-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DeliveryTimelineComponent,
    PredictiveEtaCardComponent,
    EpodUploadComponent,
    EpodAuditPanelComponent,
    OfflineSyncIndicatorComponent,
  ],
  template: `
    @if (delivery(); as d) {
      <header class="top-header">
        <div class="header-left">
          <div class="header-title-group">
            <h1 class="header-title">Delivery {{ d.id }} · {{ d.customerName }}</h1>
            <span class="header-subtitle">Order {{ d.orderId }} · {{ d.deliveryAddress }}</span>
          </div>
        </div>
        <div class="header-right">
          <app-offline-sync-indicator></app-offline-sync-indicator>
          <a [routerLink]="['/deliveries']" class="btn btn-secondary btn-sm">
            All Deliveries
          </a>
        </div>
      </header>

      <main class="page-container">
        <!-- Delivery Summary Banner -->
        <div class="panel delivery-overview-panel">
          <div class="overview-grid">
            <div class="overview-item">
              <span class="overview-label">Current Status</span>
              <span class="badge" [ngClass]="statusBadgeClass(d.status)">
                {{ d.status }}
              </span>
            </div>
            <div class="overview-item">
              <span class="overview-label">Assigned Vehicle</span>
              <span class="overview-val">{{ d.assignedAssetId || 'Not assigned' }}</span>
            </div>
            <div class="overview-item">
              <span class="overview-label">Driver</span>
              <span class="overview-val">{{ d.assignedDriverName || 'Not assigned' }}</span>
            </div>
            <div class="overview-item">
              <span class="overview-label">Scheduled Window</span>
              <span class="overview-val">{{ d.scheduledWindow }}</span>
            </div>
          </div>

          <!-- Status Transition Actions -->
          <div class="status-actions-strip">
            <span class="action-strip-label">Update Delivery Status:</span>
            <div class="status-buttons-row">
              <button
                type="button"
                class="btn btn-secondary btn-xs"
                [disabled]="d.status === 'OUT_FOR_DELIVERY'"
                (click)="onUpdateStatus('OUT_FOR_DELIVERY')"
              >
                Mark Out for Delivery
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-xs"
                [disabled]="d.status === 'ARRIVED'"
                (click)="onUpdateStatus('ARRIVED')"
              >
                Mark Arrived at Stop
              </button>
              <button
                type="button"
                class="btn btn-primary btn-xs"
                [disabled]="d.status === 'DELIVERED'"
                (click)="onUpdateStatus('DELIVERED')"
              >
                Mark Delivered
              </button>
              <button
                type="button"
                class="btn btn-danger btn-xs"
                [disabled]="d.status === 'FAILED'"
                (click)="onUpdateStatus('FAILED')"
              >
                Report Delivery Failure
              </button>
            </div>
          </div>
        </div>

        <!-- Two Column ALM Workflow: Timeline & ETA vs ePOD & AI Audit -->
        <div class="workflow-grid">
          <!-- Column 1: Predictive Traffic ETA & Stage Timeline -->
          <div class="workflow-col">
            <app-predictive-eta-card
              [assetId]="d.assignedAssetId || 'VEH-TRK-101'"
              [deliveryId]="d.id"
              [destinationAddress]="d.deliveryAddress"
              [destCoords]="d.destinationCoordinates"
            ></app-predictive-eta-card>

            <app-delivery-timeline
              [events]="d.timeline"
            ></app-delivery-timeline>
          </div>

          <!-- Column 2: Electronic Proof of Delivery & AI Audit -->
          <div class="workflow-col">
            <app-epod-upload
              [deliveryId]="d.id"
              (epodUploaded)="onEpodUploaded($event)"
            ></app-epod-upload>

            @if (epodSubmission(); as epod) {
              <app-epod-audit-panel
                [submission]="epod"
                (statusUpdated)="onAuditStatusUpdated($event)"
              ></app-epod-audit-panel>
            }
          </div>
        </div>
      </main>
    }
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    .delivery-overview-panel {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .overview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .overview-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .overview-label {
      font-size: 11px;
      color: #777777;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .overview-val {
      font-size: 14px;
      font-weight: 500;
      color: #000000;
    }

    .status-actions-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #f0f0f0;
      padding-top: 12px;
      gap: 12px;
      flex-wrap: wrap;
    }

    .action-strip-label {
      font-size: 12px;
      color: #555555;
    }

    .status-buttons-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .workflow-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .workflow-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    @media (max-width: 900px) {
      .overview-grid { grid-template-columns: repeat(2, 1fr); }
      .workflow-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DeliveryDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly deliveryStatusService = inject(DeliveryStatusService);
  private readonly toast = inject(ToastService);

  readonly delivery = signal<AlmDeliveryDetail | null>(null);
  readonly epodSubmission = signal<EpodSubmissionResponse | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || 'DEL-001';
    this.initMockDelivery(id);
  }

  private initMockDelivery(id: string): void {
    const detail: AlmDeliveryDetail = {
      id,
      orderId: 'ORD-1001',
      customerName: 'Zenith Industrials Ltd',
      customerPhone: '+234 801 234 5678',
      deliveryAddress: '14 Adeola Odeku St, Victoria Island',
      destinationCoordinates: [3.4219, 6.4281],
      city: 'Lagos',
      state: 'Lagos',
      status: 'OUT_FOR_DELIVERY',
      assignedAssetId: 'VEH-TRK-101',
      assignedDriverName: 'John Okafor',
      assignedDriverPhone: '+234 801 111 2222',
      scheduledWindow: '09:00 - 12:00',
      timeline: [
        {
          title: 'Order Created & Scheduled',
          timestamp: 'Yesterday at 14:30',
          status: 'completed',
          actor: 'System Auto-Dispatch',
        },
        {
          title: 'Dispatched to Vehicle VEH-TRK-101',
          timestamp: 'Today at 08:00',
          status: 'completed',
          actor: 'Dispatcher Kemi',
        },
        {
          title: 'Out for Delivery (En Route)',
          timestamp: 'Today at 09:15',
          status: 'current',
          actor: 'Driver John Okafor',
          location: 'Apapa Express Corridor',
        },
        {
          title: 'Arrived at Destination',
          timestamp: 'Pending',
          status: 'upcoming',
        },
        {
          title: 'Proof of Delivery & Handover',
          timestamp: 'Pending',
          status: 'upcoming',
        },
      ],
    };

    this.delivery.set(detail);

    // Initial sample ePOD record
    this.epodSubmission.set({
      epodId: 'EPOD-INIT-001',
      deliveryId: id,
      status: 'submitted',
      audit: {
        receiverName: 'A. Adeleke (Authorized Receiver)',
        deliveryDate: new Date().toISOString().split('T')[0],
        damagedCargo: false,
        manifestAuditNotes: 'AI Vision Audit: Customer signature verified. No visible package tears or structural damage on carton boxes.',
        confidenceScore: 94,
      },
      submittedAt: new Date().toISOString(),
    });
  }

  onUpdateStatus(newStatus: AlmDeliveryStatus): void {
    const current = this.delivery();
    if (!current) return;

    this.deliveryStatusService.updateStatus(current.id, newStatus).subscribe({
      next: (res) => {
        if (res.queued) {
          this.toast.info(`Offline: update to "${newStatus}" queued locally in IndexedDB.`);
        } else {
          this.toast.success(`Delivery status updated to "${newStatus}" on server.`);
        }

        // Update local UI
        const nextTimeline = [...current.timeline];
        nextTimeline.push({
          title: `Status: ${newStatus}`,
          timestamp: 'Just now',
          status: 'completed',
          actor: 'Current User',
        });

        this.delivery.set({
          ...current,
          status: newStatus,
          timeline: nextTimeline,
        });
      },
    });
  }

  onEpodUploaded(res: EpodSubmissionResponse): void {
    this.epodSubmission.set(res);
    this.toast.success('ePOD uploaded! AI Vision audit completed.');
  }

  onAuditStatusUpdated(status: 'approved' | 'review_required'): void {
    const current = this.epodSubmission();
    if (current) {
      this.epodSubmission.set({ ...current, status });
      this.toast.info(`ePOD audit status set to "${status}".`);
    }
  }

  statusBadgeClass(status: AlmDeliveryStatus): string {
    switch (status) {
      case 'DELIVERED': return 'badge-success';
      case 'OUT_FOR_DELIVERY': return 'badge-info';
      case 'ARRIVED': return 'badge-warning';
      case 'FAILED': return 'badge-error';
      default: return 'badge-neutral';
    }
  }
}
