import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  active?: boolean;
  separator?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: #0f4c2a;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 34px;
      height: 34px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 13px;
      color: white;
      letter-spacing: -0.5px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(22,163,74,0.4);
    }

    .logo-text {
      font-size: 17px;
      font-weight: 800;
      color: #fff;
      letter-spacing: -0.3px;
    }

    .logo-text span { color: #4ade80; }

    .nav-section {
      padding: 12px 10px 6px;
      flex: 1;
    }

    .nav-label {
      font-size: 10px;
      font-weight: 600;
      color: #4ade80;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0 6px;
      margin: 14px 0 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 10px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #86efac;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      margin-bottom: 1px;
    }

    .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }

    .nav-item.active {
      background: #16a34a;
      color: #fff;
      font-weight: 600;
    }

    .nav-item .icon {
      font-size: 15px;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      opacity: 0.9;
    }

    .nav-item.active .icon { opacity: 1; }

    .nav-badge {
      margin-left: auto;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 99px;
      min-width: 18px;
      text-align: center;
    }

    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
    }
  `]
})
export class SidebarComponent {
  readonly activeItem = signal('Dashboard');

  readonly mainNav: NavItem[] = [
    { label: 'Dashboard',          icon: '⊞' },
    { label: 'Orders / Loads',     icon: '📦' },
    { label: 'Dispatch Board',     icon: '📋' },
    { label: 'Fleet',              icon: '🚛' },
    { label: 'Drivers',            icon: '👤' },
    { label: 'Routes & Tracking',  icon: '🗺️' },
    { label: 'Warehouses / Hubs',  icon: '🏭' },
    { label: 'Proof of Delivery',  icon: '✅' },
  ];

  readonly secondaryNav: NavItem[] = [
    { label: 'Billing & Invoices', icon: '💳' },
    { label: 'Reports',            icon: '📊' },
    { label: 'AI Ops Assistant',   icon: '✨' },
  ];

  readonly settingsNav: NavItem[] = [
    { label: 'Settings',           icon: '⚙️' },
  ];

  setActive(label: string) {
    this.activeItem.set(label);
  }
}
