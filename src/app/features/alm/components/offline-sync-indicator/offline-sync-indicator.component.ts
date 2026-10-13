import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineSyncService } from '../../services/offline-sync.service';

@Component({
  selector: 'app-offline-sync-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sync-indicator-container">
      <div
        class="sync-pill"
        [ngClass]="pillClass()"
        [title]="statusTooltip()"
      >
        <span class="status-dot"></span>
        <span class="status-label">{{ labelText() }}</span>
        @if (offlineSyncService.pendingCount() > 0) {
          <span class="queue-badge">{{ offlineSyncService.pendingCount() }}</span>
        }
      </div>

      @if (offlineSyncService.pendingCount() > 0 && offlineSyncService.isOnline()) {
        <button
          type="button"
          class="sync-action-btn"
          [disabled]="offlineSyncService.syncState() === 'synchronizing'"
          (click)="offlineSyncService.retrySync()"
        >
          @if (offlineSyncService.syncState() === 'synchronizing') {
            <span class="mini-spinner"></span> Syncing
          } @else {
            Sync Now
          }
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    .sync-indicator-container {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .sync-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 9px;
      border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 12px;
      border: 1px solid #e5e7eb;
      background: #fbfbfb;
      color: #333333;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #888888;
    }

    .state-online .status-dot { background: #2d6a4f; }
    .state-offline .status-dot { background: #7c1f1f; }
    .state-pending .status-dot { background: #7c5a00; }
    .state-syncing .status-dot {
      background: #1a3c5e;
      animation: pulse 1s infinite alternate;
    }

    .queue-badge {
      padding: 0 4px;
      background: #000000;
      color: #fbfbfb;
      border-radius: 3px;
      font-size: 10px;
    }

    .sync-action-btn {
      height: 24px;
      padding: 0 8px;
      background: transparent;
      border: 1px solid #000000;
      border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 11px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: background 120ms ease;
    }

    .sync-action-btn:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .mini-spinner {
      width: 10px;
      height: 10px;
      border: 1.5px solid #000000;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { from { opacity: 0.3; } to { opacity: 1; } }
  `]
})
export class OfflineSyncIndicatorComponent {
  readonly offlineSyncService = inject(OfflineSyncService);

  pillClass(): string {
    const s = this.offlineSyncService.syncState();
    if (!this.offlineSyncService.isOnline()) return 'state-offline';
    if (s === 'synchronizing') return 'state-syncing';
    if (s === 'pending') return 'state-pending';
    return 'state-online';
  }

  labelText(): string {
    if (!this.offlineSyncService.isOnline()) return 'Offline Mode';
    const s = this.offlineSyncService.syncState();
    if (s === 'synchronizing') return 'Synchronizing...';
    if (s === 'pending') return 'Pending Sync';
    return 'Online';
  }

  statusTooltip(): string {
    const count = this.offlineSyncService.pendingCount();
    if (!this.offlineSyncService.isOnline()) {
      return `Offline: ${count} local mutations queued in IndexedDB`;
    }
    return count > 0 ? `${count} pending offline updates awaiting sync` : 'All updates synchronized';
  }
}
