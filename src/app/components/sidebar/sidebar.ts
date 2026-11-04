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
      background: #061432;
      display: flex; flex-direction: column;
      height: 100%; overflow-y: auto; overflow-x: hidden;
      border-right: 1px solid #1d2b49;
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

    .nav-label {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11px; font-weight: 400;
      color: #8594ae;
      letter-spacing: 0; text-transform: uppercase;
      padding: 0 8px; margin: 16px 0 4px;
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

    /* ── Alert badge ── */
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

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px 12px 16px;
      border-top: 1px solid #1d2b49;
      flex-shrink: 0;
    }

    @media (max-width: 760px) {
      :host { width: 100%; min-width: 0; height: auto; }
      .sidebar { width: 100%; min-width: 0; height: auto; overflow: hidden; border-right: 0; border-bottom: 1px solid #1d2b49; }
      .sidebar-logo { min-height: 54px; padding: 8px 12px; border-bottom: 0; }
      .logo-image { max-width: 156px; }
      .nav-section { display: flex; flex: none; gap: 2px; overflow-x: auto; overflow-y: hidden; padding: 4px 8px 8px; white-space: nowrap; }
      .nav-label { display: none; }
      .nav-item { flex: 0 0 auto; min-height: 44px; margin-bottom: 0; padding: 8px 10px; }
      .sidebar-footer { display: none; }
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
    { label: 'Live Tracking', icon: 'tracking',  route: '/tracking' },
    { label: 'Routes',        icon: 'routes',    route: '/routes' },
  ];

  readonly deliveryNav = [
    { label: 'Deliveries',    icon: 'deliveries', route: '/deliveries' },
    { label: 'Exceptions',    icon: 'exceptions', route: '/exceptions', badge: 3 },
    { label: 'Carriers',      icon: 'carriers',   route: '/carriers' },
    { label: 'Analytics',     icon: 'analytics',  route: '/analytics' },
  ];
}
