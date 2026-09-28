import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  icon: string; // SVG path
  route: string;
  badgeSignal?: () => number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }

    .sidebar {
      width: 220px; min-width: 220px;
      background: #fbfbfb;
      display: flex; flex-direction: column;
      height: 100%; overflow-y: auto; overflow-x: hidden;
      border-right: 1px solid #e5e7eb;
    }

    /* ── Logo ── */
    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 18px 18px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    /* 3×3 block mark — rigid square grid */
    .logo-mark {
      display: grid;
      grid-template-columns: repeat(3, 5px);
      grid-template-rows: repeat(3, 5px);
      gap: 2px;
      flex-shrink: 0;
    }
    .logo-mark span {
      display: block;
      width: 5px; height: 5px;
      background: #000000;
    }

    .logo-text {
      font-family: 'Times New Roman', Times, serif;
      font-size: 15px; font-weight: 400;
      color: #000000; letter-spacing: 0;
    }

    .logo-sub {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12px; font-weight: 400;
      color: #888888; letter-spacing: 0;
    }

    /* ── Nav ── */
    .nav-section { padding: 12px 12px 6px; flex: 1; }

    .nav-label {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11px; font-weight: 400;
      color: #888888;
      letter-spacing: 0; text-transform: uppercase;
      padding: 0 8px; margin: 16px 0 4px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px; border-radius: 4px;
      font-family: 'Times New Roman', Times, serif;
      font-size: 14px; font-weight: 400;
      color: #555555; text-decoration: none;
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease;
      margin-bottom: 1px;
    }
    .nav-item:hover {
      background: rgba(0,0,0,0.04);
      color: #000000;
    }
    .nav-item.active-link {
      background: rgba(0,0,0,0.07);
      color: #000000;
    }
    .nav-item .icon-wrap {
      width: 16px; height: 16px;
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      opacity: 0.45;
    }
    .nav-item:hover .icon-wrap    { opacity: 0.7; }
    .nav-item.active-link .icon-wrap { opacity: 1; }

    /* ── Alert badge ── */
    .nav-badge {
      margin-left: auto;
      background: transparent;
      border: 1px solid #7c1f1f;
      color: #7c1f1f;
      font-family: 'Times New Roman', Times, serif;
      font-size: 10px; font-weight: 400;
      padding: 0 5px; border-radius: 4px;
      min-width: 16px; text-align: center;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px 12px 16px;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
    }
  `]
})
export class SidebarComponent {
  readonly mainNav = [
    { label: 'Dashboard',     icon: 'dashboard', route: '/' },
    { label: 'Orders',        icon: 'orders',    route: '/orders' },
    { label: 'Loads',         icon: 'loads',     route: '/loads' },
    { label: 'Dispatch',      icon: 'dispatch',  route: '/dispatch' },
  ];

  readonly opsNav = [
    { label: 'Fleet',         icon: 'fleet',     route: '/fleet' },
    { label: 'Drivers',       icon: 'drivers',   route: '/drivers' },
    { label: 'Routes',        icon: 'routes',    route: '/routes' },
    { label: 'Live Tracking', icon: 'tracking',  route: '/tracking' },
  ];

  readonly deliveryNav = [
    { label: 'Deliveries',    icon: 'deliveries', route: '/deliveries' },
    { label: 'Exceptions',    icon: 'exceptions', route: '/exceptions', badge: 3 },
    { label: 'Carriers',      icon: 'carriers',   route: '/carriers' },
    { label: 'Analytics',     icon: 'analytics',  route: '/analytics' },
  ];
}
