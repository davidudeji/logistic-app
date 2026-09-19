import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

/**
 * Simple SVG horizontal bar chart — no external library needed.
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar-chart">
      @for (item of items; track item.label; let i = $index) {
        <div class="bar-row">
          <div class="bar-label">{{ item.label }}</div>
          <div class="bar-track">
            <div class="bar-fill"
                 [style.width]="pct(item.value) + '%'"
                 [style.background]="item.color ?? defaultColor"
                 [style.animation-delay]="(i * 80) + 'ms'">
            </div>
          </div>
          <div class="bar-value data-mono">{{ item.value }}</div>
        </div>
      }
    </div>
  `,
  styles: [`
    .bar-chart { display: flex; flex-direction: column; gap: 10px; }
    .bar-row { display: flex; align-items: center; gap: 12px; }
    .bar-label {
      width: 130px; flex-shrink: 0;
      font-size: 12px; font-weight: 500; color: #64748B;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .bar-track {
      flex: 1; height: 8px;
      background: #E2E8F0;
      border-radius: 99px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; border-radius: 99px;
      transition: width 600ms cubic-bezier(0.4,0,0.2,1);
      animation: bar-grow 600ms cubic-bezier(0.4,0,0.2,1) both;
    }
    @keyframes bar-grow {
      from { width: 0 !important; }
    }
    .bar-value {
      width: 48px; text-align: right;
      font-size: 12px; font-weight: 600; color: #0F172A;
    }
  `]
})
export class BarChartComponent {
  @Input() items: BarChartItem[] = [];
  @Input() defaultColor = '#2563EB';

  pct(value: number): number {
    const max = Math.max(...this.items.map(i => i.value), 1);
    return Math.round((value / max) * 100);
  }
}
