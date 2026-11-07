import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { InventoryService } from '../../features/inventory/inventory.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .sidebar-shell {
      position: relative;
      height: 100%;
    }

    .sidebar {
      width: 220px; min-width: 220px;
      background: #061432;
      display: flex; flex-direction: column;
      height: 100%; overflow-y: auto; overflow-x: hidden;
      border-right: 1px solid #1d2b49;
      transition: transform 180ms ease;
    }

    .sidebar-overlay {
      display: none;
    }

    .mobile-menu-toggle {
      display: none;
    }

    /* ── Logo ── */
    .sidebar-logo {
      display: flex; align-items: center;
      min-height: 78px;
      padding: 16px;
      border-bottom: 1px solid #1d2b49;
      flex-shrink: 0;
      color: inherit; text-decoration: none;
    }
    .sidebar-logo:focus-visible {
      outline: 2px solid #00cce5;
      outline-offset: -2px;
    }
    .logo-image { display: block; width: 100%; max-width: 188px; height: auto; }

    /* ── Nav ── */
    .nav-section { padding: 12px 12px 6px; flex: 1; }
    .nav-group { margin-bottom: 4px; }

    .nav-group-toggle {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; border: 0; background: transparent; color: inherit;
      padding: 0 8px; margin: 14px 0 4px; cursor: pointer;
    }

    .nav-label {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11px; font-weight: 400;
      color: #8594ae;
      letter-spacing: 0; text-transform: uppercase;
      padding: 0 8px;
      text-align: left;
    }

    .nav-group-toggle .chevron {
      width: 16px; height: 16px; color: #8594ae; transition: transform 150ms ease;
    }
    .nav-group.collapsed .nav-group-toggle .chevron {
      transform: rotate(-90deg);
    }

    .nav-group-items {
      display: flex; flex-direction: column;
      gap: 1px;
      overflow: hidden;
    }

    .nav-group.collapsed .nav-group-items {
      display: none;
    }

    .nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px; border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px; font-weight: 400;
      color: #c1ccdc; text-decoration: none;
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease;
      margin-bottom: 1px;
    }
    .nav-item:hover {
      background: rgba(0,204,229,0.08);
      color: #f5f8ff;
    }
    .nav-item.active-link {
      background: rgba(0,204,229,0.14);
      color: #00cce5;
    }
    .nav-item .icon-wrap {
      width: 16px; height: 16px;
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      opacity: 0.45;
    }
    .nav-item:hover .icon-wrap    { opacity: 0.7; }
    .nav-item.active-link .icon-wrap { opacity: 1; }

    .nav-badge {
      margin-left: auto;
      background: transparent;
      border: 1px solid #ff941f;
      color: #ffb451;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10px; font-weight: 400;
      padding: 0 5px; border-radius: 4px;
      min-width: 16px; text-align: center;
    }

    .sidebar-footer {
      padding: 10px 12px 16px;
      border-top: 1px solid #1d2b49;
      flex-shrink: 0;
    }

    @media (max-width: 760px) {
      :host { width: 100%; min-width: 0; height: auto; }

      .sidebar-shell {
        position: fixed;
        inset: 0 auto 0 0;
        width: min(82vw, 320px);
        z-index: 80;
        pointer-events: none;
      }

      .sidebar {
        width: min(82vw, 320px);
        min-width: 0;
        height: 100%;
        border-right: 1px solid #1d2b49;
        transform: translateX(-102%);
        pointer-events: auto;
      }

      .sidebar-shell.mobile-open .sidebar {
        transform: translateX(0);
      }

      .sidebar-overlay {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(2, 10, 19, 0.62);
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease;
      }

      .sidebar-shell.mobile-open .sidebar-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      .mobile-menu-toggle {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 90;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 10px;
        background: rgba(6,20,50,0.9);
        color: #fff;
        cursor: pointer;
      }

      .mobile-menu-toggle span,
      .mobile-menu-toggle::before,
      .mobile-menu-toggle::after {
        content: "";
        position: absolute;
        width: 18px;
        height: 2px;
        border-radius: 2px;
        background: currentColor;
      }

      .mobile-menu-toggle span { transform: translateY(0); }
      .mobile-menu-toggle::before { transform: translateY(-6px); }
      .mobile-menu-toggle::after { transform: translateY(6px); }

      .sidebar-shell.mobile-open .mobile-menu-toggle {
        background: #061432;
      }

      .sidebar-logo {
        min-height: 62px;
        padding: 12px 16px;
        border-bottom: 0;
      }
      .logo-image { max-width: 156px; }
      .nav-section { padding: 10px 10px 8px; }
      .nav-label {
        padding: 0 8px;
        margin: 4px 0;
      }
      .nav-item { min-height: 42px; }
      .sidebar-footer { display: block; }
    }
  `]
})
export class SidebarComponent {
  private readonly inventoryService = inject(InventoryService);
  readonly invLowStock = this.inventoryService.lowStockTotal;
  readonly mobileMenuOpen = signal(false);
  readonly expandedGroups = signal<Record<string, boolean>>({
    Operations: true,
    'Inventory': true,
    'Fleet & Field': true,
    'Automated Logistics': true,
    Delivery: true,
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleGroup(group: string): void {
    this.expandedGroups.update(current => ({
      ...current,
      [group]: !(current[group] ?? true),
    }));
  }

  isExpanded(group: string): boolean {
    return this.expandedGroups()[group] ?? true;
  }
}
