import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpodService } from '../../services/epod.service';
import { EpodSubmissionResponse } from '../../models/epod-audit.model';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-epod-audit-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audit-panel">
      <div class="panel-header">
        <div>
          <h4 class="panel-title">AI Document Audit</h4>
          <span class="panel-subtitle">OpenAI GPT-4o Vision Verification</span>
        </div>
        <span class="badge" [ngClass]="statusBadgeClass()">
          {{ submission.status | uppercase }}
        </span>
      </div>

      @if (submission.audit; as audit) {
        <div class="audit-content">
          <div class="audit-grid">
            <div class="audit-field">
              <span class="field-label">Verified Receiver</span>
              <span class="field-value">{{ audit.receiverName || 'Not detected' }}</span>
            </div>
            <div class="audit-field">
              <span class="field-label">Document Date</span>
              <span class="field-value">{{ audit.deliveryDate || 'Not detected' }}</span>
            </div>
            <div class="audit-field">
              <span class="field-label">Cargo Condition</span>
              <span class="field-value" [class.damaged-alert]="audit.damagedCargo">
                {{ audit.damagedCargo ? '⚠️ DAMAGE DETECTED' : '✓ Intact / No Damage' }}
              </span>
            </div>
            <div class="audit-field">
              <span class="field-label">Confidence</span>
              <span class="field-value">{{ audit.confidenceScore ?? 95 }}%</span>
            </div>
          </div>

          <div class="notes-box">
            <span class="field-label">Manifest & Document Audit Notes</span>
            <p class="notes-text">{{ audit.manifestAuditNotes }}</p>
          </div>

          <!-- Document download / view URL -->
          <div class="doc-actions-row">
            <button type="button" class="btn btn-secondary btn-xs" (click)="onOpenDocument()">
              View Document (Secure S3 Presigned URL)
            </button>
            @if (submission.reviewedBy) {
              <span class="reviewed-text">
                Reviewed by {{ submission.reviewedBy }} on {{ formatReviewDate(submission.reviewedAt) }}
              </span>
            }
          </div>

          <!-- Auditor Action Controls -->
          @if (canReview()) {
            <div class="review-actions">
              <button
                type="button"
                class="btn btn-primary btn-sm"
                [disabled]="submission.status === 'approved'"
                (click)="onApprove()"
              >
                Approve Audit
              </button>
              <button
                type="button"
                class="btn btn-danger btn-sm"
                [disabled]="submission.status === 'review_required'"
                (click)="onRequestReview()"
              >
                Flag for Manual Inspection
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="empty-audit">
          <span class="mini-spinner"></span>
          <span>Analyzing document with OpenAI GPT-4o Vision...</span>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .audit-panel {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }

    .panel-title {
      font-size: 15px;
      margin: 0;
      color: #000000;
    }

    .panel-subtitle {
      font-size: 11px;
      color: #666666;
    }

    .audit-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .audit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .audit-field {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .field-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888888;
    }

    .field-value {
      font-size: 13px;
      font-weight: 500;
      color: #000000;
    }

    .damaged-alert {
      color: #7c1f1f;
      font-weight: bold;
    }

    .notes-box {
      background: #f4f4f5;
      border-radius: 4px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notes-text {
      font-size: 12px;
      color: #333333;
      margin: 0;
      line-height: 1.4;
    }

    .doc-actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 4px;
    }

    .reviewed-text {
      font-size: 11px;
      color: #666666;
    }

    .review-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      border-top: 1px solid #f0f0f0;
      padding-top: 10px;
    }

    .empty-audit {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 20px;
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
export class EpodAuditPanelComponent {
  readonly epodService = inject(EpodService);
  readonly authService = inject(AuthService);

  @Input({ required: true }) submission!: EpodSubmissionResponse;
  @Output() statusUpdated = new EventEmitter<'approved' | 'review_required'>();

  statusBadgeClass(): string {
    switch (this.submission.status) {
      case 'approved':
        return 'badge-success';
      case 'review_required':
      case 'rejected':
        return 'badge-error';
      case 'audit_pending':
      case 'submitted':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  }

  canReview(): boolean {
    return this.authService.canAccess('epod_audit');
  }

  onApprove(): void {
    const reviewer = this.authService.currentUser()?.name || 'Authorized Auditor';
    this.epodService.updateAuditStatus(this.submission.deliveryId, 'approved', reviewer);
    this.statusUpdated.emit('approved');
  }

  onRequestReview(): void {
    const reviewer = this.authService.currentUser()?.name || 'Authorized Auditor';
    this.epodService.updateAuditStatus(this.submission.deliveryId, 'review_required', reviewer);
    this.statusUpdated.emit('review_required');
  }

  onOpenDocument(): void {
    this.epodService.getDownloadUrl(this.submission.epodId).subscribe({
      next: (res) => {
        if (typeof window !== 'undefined') {
          window.open(res.downloadUrl, '_blank');
        }
      },
    });
  }

  formatReviewDate(iso?: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' });
  }
}
