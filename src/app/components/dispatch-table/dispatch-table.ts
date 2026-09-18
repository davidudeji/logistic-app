import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FleetService, DispatchJob } from '../../services/fleet';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dispatch-table',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }

    .dispatch-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }

    .dispatch-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
      position: relative;
      overflow: hidden;
    }

    .dispatch-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 3px; height: 100%;
      border-radius: 3px 0 0 3px;
      background: var(--card-accent, #e2e8f0);
      transition: width 0.2s ease;
    }

    .dispatch-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.10); transform: translateY(-2px); border-color: #cbd5e1; }
    .dispatch-card:hover::before { width: 4px; }

    .card-id {
      font-family: 'Courier New', monospace;
      font-size: 11.5px;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 10px;
      letter-spacing: 0.01em;
    }

    .card-route {
      font-size: 12.5px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }

    .route-arrow {
      color: #94a3b8;
      font-size: 12px;
    }

    .card-meta {
      font-size: 11.5px;
      color: #64748b;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .card-meta-icon { font-size: 11px; }

    .card-footer {
      margin-top: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: 99px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.03em;
    }

    .status-pill::before {
      content: '';
      width: 5px; height: 5px;
      border-radius: 50%;
      background: currentColor;
      flex-shrink: 0;
    }

    .pill-on-time   { background: #dcfce7; color: #15803d; }
    .pill-assigned  { background: #ede9fe; color: #6d28d9; }
    .pill-loading   { background: #fef3c7; color: #92400e; }
    .pill-delayed   { background: #dbeafe; color: #1d4ed8; }
    .pill-critical  { background: #fee2e2; color: #b91c1c; }
    .pill-delivered { background: #f1f5f9; color: #475569; }
    .pill-unassigned{ background: #f8fafc; color: #94a3b8; }

    .card-eta {
      font-size: 10.5px;
      color: #94a3b8;
      font-weight: 500;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .section-count {
      font-size: 12px;
      color: #64748b;
      background: #f1f5f9;
      padding: 3px 10px;
      border-radius: 99px;
      font-weight: 500;
    }

    .view-all-btn {
      font-size: 12.5px;
      color: #16a34a;
      font-weight: 600;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }

    .view-all-btn:hover { color: #15803d; }
  `],
  template: `
    @if (jobs$ | async; as jobs) {
      <div class="dispatch-grid">
        @for (job of jobs; track job.id; let i = $index) {
          <div class="dispatch-card animate-fade-up"
               [style.animation-delay]="(i * 50) + 'ms'"
               [style.--card-accent]="getAccentColor(job.status)">
            <!-- Load ID -->
            <div class="card-id">{{ job.id }}</div>

            <!-- Route -->
            <div class="card-route">
              <span>{{ job.origin }}</span>
              <span class="route-arrow">→</span>
              <span>{{ job.destination }}</span>
            </div>

            <!-- Meta -->
            <div class="card-meta">
              <span class="card-meta-icon">👤</span>
              <span>{{ job.driver }}</span>
            </div>
            <div class="card-meta">
              <span class="card-meta-icon">📦</span>
              <span>{{ job.cargo }}</span>
            </div>
            <div class="card-meta">
              <span class="card-meta-icon">📍</span>
              <span>{{ job.distance }}</span>
            </div>

            <!-- Footer -->
            <div class="card-footer">
              <span class="status-pill" [ngClass]="getPillClass(job.status)">
                {{ job.status }}
              </span>
              <span class="card-eta">ETA {{ job.eta }}</span>
            </div>
          </div>
        }
      </div>
    }
  `
})
export class DispatchTableComponent implements OnInit {
  jobs$!: Observable<DispatchJob[]>;

  constructor(private fleetService: FleetService) {}

  ngOnInit(): void {
    this.jobs$ = this.fleetService.getJobs();
  }

  getPillClass(status: string): string {
    const map: Record<string, string> = {
      'On Time':   'pill-on-time',
      'Assigned':  'pill-assigned',
      'Loading':   'pill-loading',
      'Delayed':   'pill-delayed',
      'Critical':  'pill-critical',
      'Delivered': 'pill-delivered',
      'Unassigned':'pill-unassigned',
    };
    return map[status] ?? 'pill-unassigned';
  }

  getAccentColor(status: string): string {
    const map: Record<string, string> = {
      'On Time':   '#16a34a',
      'Assigned':  '#8b5cf6',
      'Loading':   '#f59e0b',
      'Delayed':   '#3b82f6',
      'Critical':  '#ef4444',
      'Delivered': '#6b7280',
      'Unassigned':'#cbd5e1',
    };
    return map[status] ?? '#cbd5e1';
  }
}
