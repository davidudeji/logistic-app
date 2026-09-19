import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-outlet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }} animate-fade-up" role="alert">
          <span class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              }
              @case ('error') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              }
              @case ('warning') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              }
              @default {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              }
            }
          </span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" [attr.aria-label]="'Dismiss'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed; bottom: 24px; right: 24px;
      z-index: 9999; display: flex; flex-direction: column-reverse; gap: 8px;
      pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 11px 14px;
      border-radius: 10px;
      font-size: 13px; font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      pointer-events: all;
      min-width: 280px; max-width: 420px;
      border: 1px solid transparent;
    }
    .toast-success { background: #052e16; color: #86efac; border-color: #166534; }
    .toast-error   { background: #450a0a; color: #fca5a5; border-color: #991b1b; }
    .toast-warning { background: #451a03; color: #fcd34d; border-color: #92400e; }
    .toast-info    { background: #0c1a3a; color: #93c5fd; border-color: #1e40af; }
    .toast-icon    { flex-shrink: 0; opacity: 0.9; }
    .toast-msg     { flex: 1; line-height: 1.4; }
    .toast-close {
      background: transparent; border: none; cursor: pointer;
      color: inherit; opacity: 0.6; padding: 2px;
      display: flex; align-items: center; flex-shrink: 0;
      transition: opacity 120ms ease;
    }
    .toast-close:hover { opacity: 1; }
  `]
})
export class ToastOutletComponent {
  readonly toastService = inject(ToastService);
}
