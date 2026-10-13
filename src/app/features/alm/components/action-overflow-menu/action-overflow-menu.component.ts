import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Global singleton tracker to ensure only one dropdown menu is open at a time
let activeMenuInstance: ActionOverflowMenuComponent | null = null;

@Component({
  selector: 'app-action-overflow-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-menu-container">
      <!-- 1. TRIGGER: Vertical ellipsis centered in a >=44x44px hit-target -->
      <button
        type="button"
        class="overflow-trigger-btn"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'menu'"
        [attr.aria-label]="ariaLabel || 'Row action options'"
        (click)="toggleMenu($event)"
      >
        <svg
          class="ellipsis-icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      <!-- 2. DROPDOWN MENU: Absolute floating container aligned to right side below trigger (z-index: 50) -->
      @if (isOpen()) {
        <div
          class="dropdown-menu"
          role="menu"
          [attr.aria-label]="'Action menu for ' + (entityName || 'item')"
        >
          <!-- Option 1: View (Standard neutral dark text styling) -->
          <button
            type="button"
            class="menu-item view-item"
            role="menuitem"
            tabindex="0"
            (click)="onSelectView($event)"
          >
            <svg class="item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>View</span>
          </button>

          <!-- Option 2: Edit (Standard neutral dark text styling) -->
          <button
            type="button"
            class="menu-item edit-item"
            role="menuitem"
            tabindex="0"
            (click)="onSelectEdit($event)"
          >
            <svg class="item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Edit</span>
          </button>

          <!-- Option 3: Delete (Destructive red text treatment with soft red background on hover) -->
          <button
            type="button"
            class="menu-item delete-item"
            role="menuitem"
            tabindex="0"
            (click)="onSelectDelete($event)"
          >
            <svg class="item-icon delete-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
            <span>Delete</span>
          </button>
        </div>
      }

      <!-- 5. DELETION SAFEGUARD: Screen-centered confirmation modal with backdrop -->
      @if (showDeleteModal()) {
        <div
          class="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
          (click)="onBackdropClick($event)"
        >
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c1f1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h2 id="modal-title" class="modal-title">Confirm Deletion</h2>
            </div>

            <p id="modal-desc" class="modal-body">
              Are you sure you want to delete
              <strong>{{ entityName || 'this record' }}</strong>? This action is permanent and cannot be undone.
            </p>

            <div class="modal-footer">
              <!-- Neutral gray "Cancel" button -->
              <button
                type="button"
                class="modal-btn modal-cancel-btn"
                (click)="closeDeleteModal()"
              >
                Cancel
              </button>
              <!-- Primary red "Delete" button -->
              <button
                type="button"
                class="modal-btn modal-delete-btn"
                (click)="confirmDelete()"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
    }

    .overflow-menu-container {
      position: relative;
      display: inline-block;
    }

    /* 1. TRIGGER: >= 44x44px hit-target */
    .overflow-trigger-btn {
      width: 44px;
      min-width: 44px;
      height: 44px;
      min-height: 44px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      color: #000000;
      transition: background 120ms ease, border-color 120ms ease;
    }

    .overflow-trigger-btn:hover {
      background: rgba(0, 0, 0, 0.05);
      border-color: #e5e7eb;
    }

    .overflow-trigger-btn:focus-visible {
      outline: 2px solid #000000;
      outline-offset: 2px;
    }

    .ellipsis-icon {
      color: #111111;
      pointer-events: none;
    }

    /* 2. DROPDOWN MENU: floating, right-aligned, z-index: 50 */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 4px);
      right: 0;
      z-index: 50;
      min-width: 140px;
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      padding: 4px 0;
      display: flex;
      flex-direction: column;
      animation: menuFadeIn 120ms ease-out;
    }

    @keyframes menuFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* 4. VISUAL HIERARCHY */
    .menu-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      height: 36px;
      padding: 0 14px;
      background: transparent;
      border: none;
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      font-weight: 400;
      cursor: pointer;
      text-align: left;
      transition: background 100ms ease, color 100ms ease;
    }

    .item-icon {
      flex-shrink: 0;
      opacity: 0.8;
    }

    /* "View" & "Edit": Standard neutral dark text styling */
    .view-item, .edit-item {
      color: #111111;
    }

    .view-item:hover, .view-item:focus-visible,
    .edit-item:hover, .edit-item:focus-visible {
      background: rgba(0, 0, 0, 0.06);
      color: #000000;
      outline: none;
    }

    /* "Delete": Destructive red text with soft red background on hover */
    .delete-item {
      color: #7c1f1f;
      border-top: 1px solid #f0f0f0;
      margin-top: 2px;
      padding-top: 4px;
    }

    .delete-item .delete-icon {
      stroke: #7c1f1f;
    }

    .delete-item:hover, .delete-item:focus-visible {
      background: rgba(124, 31, 31, 0.08);
      color: #7c1f1f;
      outline: none;
    }

    /* 5. DELETION SAFEGUARD: Screen-centered confirmation modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 100;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .modal-card {
      background: #fbfbfb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      padding: 24px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.14);
      display: flex;
      flex-direction: column;
      gap: 16px;
      animation: modalScaleIn 140ms ease-out;
    }

    @keyframes modalScaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-warning-icon {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      background: rgba(124, 31, 31, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .modal-title {
      font-family: 'Times New Roman', Times, serif;
      font-size: 18px;
      font-weight: 600;
      color: #111111;
      margin: 0;
      line-height: 1.2;
    }

    .modal-body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      line-height: 1.5;
      color: #444444;
      margin: 0;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 8px;
    }

    .modal-btn {
      height: 38px;
      padding: 0 16px;
      border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: background 120ms ease, opacity 120ms ease;
    }

    /* Neutral gray "Cancel" button */
    .modal-cancel-btn {
      background: transparent;
      border: 1px solid #cccccc;
      color: #333333;
    }

    .modal-cancel-btn:hover {
      background: #f0f0f0;
    }

    /* Primary red "Delete" button */
    .modal-delete-btn {
      background: #7c1f1f;
      border: 1px solid #7c1f1f;
      color: #fbfbfb;
      font-weight: 500;
    }

    .modal-delete-btn:hover {
      opacity: 0.9;
    }
  `],
})
export class ActionOverflowMenuComponent {
  private readonly elementRef = inject(ElementRef);

  @Input() entityId?: string;
  @Input() entityName?: string;
  @Input() ariaLabel?: string;

  @Output() view = new EventEmitter<string | undefined>();
  @Output() edit = new EventEmitter<string | undefined>();
  @Output() deleteConfirmed = new EventEmitter<string | undefined>();

  readonly isOpen = signal<boolean>(false);
  readonly showDeleteModal = signal<boolean>(false);

  // 3. INTERACTION & DISMISS: Complete "light dismiss"
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.closeMenu();
    }
    if (this.showDeleteModal()) {
      this.closeDeleteModal();
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen()) {
      this.closeMenu();
    } else {
      // Ensure only one menu is open at a time across any table rows
      if (activeMenuInstance && activeMenuInstance !== this) {
        activeMenuInstance.closeMenu();
      }
      activeMenuInstance = this;
      this.isOpen.set(true);
    }
  }

  closeMenu(): void {
    this.isOpen.set(false);
    if (activeMenuInstance === this) {
      activeMenuInstance = null;
    }
  }

  onSelectView(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    this.view.emit(this.entityId);
  }

  onSelectEdit(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    this.edit.emit(this.entityId);
  }

  onSelectDelete(event: MouseEvent): void {
    event.stopPropagation();
    this.closeMenu();
    // Instantly opens screen-centered confirmation modal with backdrop
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
  }

  confirmDelete(): void {
    this.showDeleteModal.set(false);
    this.deleteConfirmed.emit(this.entityId);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDeleteModal();
    }
  }
}
