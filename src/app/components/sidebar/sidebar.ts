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
      width: 228px; min-width: 228px;
      background: #05090c;
      display: flex; flex-direction: column;
      height: 100%; overflow-y: auto; overflow-x: hidden;
      border-right: 1px solid #1e2c31;
    }

    /* ── Logo ── */
    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 30px; height: 30px;
      background: #0071e3;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 0 0 1px rgba(0,113,227,0.4);
    }
    .logo-icon svg { color: white; }

    .logo-text {
      font-family: 'Inter', 'Helvetica Neue', sans-serif;
      font-size: 15px; font-weight: 800;
      color: #fff; letter-spacing: -0.04em;
    }
    .logo-text span { color: #38bdf8; }

    .logo-sub {
      font-size: 9px; font-weight: 500;
      color: #2a3c45; text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Nav ── */
    .nav-section { padding: 10px 10px 6px; flex: 1; }

    .nav-label {
      font-size: 9.5px; font-weight: 600;
      color: #2a3c45;
      letter-spacing: 0.1em; text-transform: uppercase;
      padding: 0 8px; margin: 18px 0 4px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 9px;
      padding: 7px 10px; border-radius: 9999px;   /* Apple pill nav */
      font-size: 13px; font-weight: 500;
      color: #5a7080; text-decoration: none;
      cursor: pointer;
      transition: background 130ms ease, color 130ms ease;
      margin-bottom: 2px;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.05);
      color: #cbd5e1;
    }
    .nav-item.active-link {
      background: rgba(255,255,255,0.08);
      color: #ffffff; font-weight: 600;
    }
    .nav-item .icon-wrap {
      width: 17px; height: 17px;
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      opacity: 0.6;
    }
    .nav-item:hover .icon-wrap    { opacity: 0.8; }
    .nav-item.active-link .icon-wrap { opacity: 1; }

    /* ── Alert badge ── */
    .nav-badge {
      margin-left: auto;
      background: rgba(248,113,113,0.15);
      color: #f87171;
      font-size: 10px; font-weight: 700;
      padding: 1px 7px; border-radius: 9999px;
      min-width: 18px; text-align: center;
    }

    /* ── Footer ── */
    .sidebar-footer {
      padding: 10px 10px 14px;
      border-top: 1px solid rgba(255,255,255,0.05);
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
