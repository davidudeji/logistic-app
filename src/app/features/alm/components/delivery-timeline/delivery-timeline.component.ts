import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlmTimelineEvent } from '../../models/delivery.model';

@Component({
  selector: 'app-delivery-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-container">
      <h4 class="timeline-title">Delivery Status Timeline</h4>

      <div class="timeline-track">
        @for (item of events; track item.title; let idx = $index; let last = $last) {
          <div class="timeline-node" [ngClass]="'status-' + item.status">
            <div class="node-indicator">
              <span class="node-dot"></span>
              @if (!last) {
                <span class="node-connector"></span>
              }
            </div>
            <div class="node-content">
              <div class="node-header">
                <span class="event-title">{{ item.title }}</span>
                <span class="event-time">{{ item.timestamp }}</span>
              </div>
              @if (item.description) {
                <p class="event-desc">{{ item.description }}</p>
              }
              @if (item.actor || item.location) {
                <div class="event-meta">
                  @if (item.actor) { <span>By: {{ item.actor }}</span> }
                  @if (item.location) { <span>Loc: {{ item.location }}</span> }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .timeline-container {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .timeline-title {
      font-size: 15px;
      margin: 0 0 16px;
      color: #000000;
    }

    .timeline-track {
      display: flex;
      flex-direction: column;
    }

    .timeline-node {
      display: flex;
      gap: 14px;
      min-height: 54px;
    }

    .node-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 14px;
      flex-shrink: 0;
    }

    .node-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2px solid #cccccc;
      background: #ffffff;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .node-connector {
      width: 2px;
      flex: 1;
      background: #e5e7eb;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .status-completed .node-dot {
      border-color: #2d6a4f;
      background: #2d6a4f;
    }

    .status-completed .node-connector {
      background: #2d6a4f;
    }

    .status-current .node-dot {
      border-color: #000000;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
    }

    .status-upcoming .node-dot {
      border-color: #d1d5db;
      background: #f4f4f5;
    }

    .node-content {
      flex: 1;
      padding-bottom: 14px;
    }

    .node-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .event-title {
      font-size: 13px;
      font-weight: 600;
      color: #000000;
    }

    .event-time {
      font-size: 11px;
      color: #888888;
    }

    .event-desc {
      font-size: 12px;
      color: #555555;
      margin: 2px 0 0;
    }

    .event-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: #888888;
      margin-top: 4px;
    }
  `],
})
export class DeliveryTimelineComponent {
  @Input() events: AlmTimelineEvent[] = [];
}
