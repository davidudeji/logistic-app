import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Sparkline — a lightweight inline SVG line chart.
 * No external deps. Pass an array of numbers and a color.
 */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="width" [attr.height]="height" [attr.viewBox]="'0 0 ' + width + ' ' + height"
         style="display:block;overflow:visible;">
      <!-- Area fill -->
      <defs>
        <linearGradient [id]="gradId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" [attr.stop-color]="color" stop-opacity="0.25"/>
          <stop offset="100%" [attr.stop-color]="color" stop-opacity="0"/>
        </linearGradient>
      </defs>
      @if (areaPath) {
        <path [attr.d]="areaPath" [attr.fill]="'url(#' + gradId + ')'" />
      }
      @if (linePath) {
        <path [attr.d]="linePath" [attr.stroke]="color" stroke-width="1.8"
              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      }
      <!-- Last point dot -->
      @if (lastPoint) {
        <circle [attr.cx]="lastPoint.x" [attr.cy]="lastPoint.y" r="3"
                [attr.fill]="color"/>
      }
    </svg>
  `,
})
export class SparklineComponent implements OnChanges {
  @Input() data: number[] = [];
  @Input() color = '#2563EB';
  @Input() width = 80;
  @Input() height = 32;

  linePath = '';
  areaPath = '';
  lastPoint: { x: number; y: number } | null = null;
  readonly gradId = `sg-${Math.random().toString(36).slice(2, 7)}`;

  ngOnChanges(): void {
    this.compute();
  }

  private compute(): void {
    if (!this.data?.length) return;

    const pts = this.data;
    const min = Math.min(...pts);
    const max = Math.max(...pts);
    const range = max - min || 1;
    const pad = 3;
    const w = this.width;
    const h = this.height;

    const xs = pts.map((_, i) => (i / (pts.length - 1 || 1)) * (w - pad * 2) + pad);
    const ys = pts.map(v => h - pad - ((v - min) / range) * (h - pad * 2));

    const coords = xs.map((x, i) => ({ x, y: ys[i] }));

    // Line path with smooth curves
    this.linePath = coords.reduce((acc, pt, i) => {
      if (i === 0) return `M${pt.x},${pt.y}`;
      const prev = coords[i - 1];
      const cpX = (prev.x + pt.x) / 2;
      return `${acc} C${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
    }, '');

    // Area path closes back to the bottom
    this.areaPath = this.linePath +
      ` L${coords[coords.length - 1].x},${h} L${coords[0].x},${h} Z`;

    this.lastPoint = coords[coords.length - 1];
  }
}
