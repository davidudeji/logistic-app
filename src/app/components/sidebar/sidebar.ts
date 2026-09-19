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
      width: 240px; min-width: 240px;
      background: #0F172A;
      display: flex; flex-direction: column;
      height: 100%; overflow-y: auto; overflow-x: hidden;
    }

    .sidebar-logo {
      display: flex; align-items: center; gap: 10px;
      padding: 18px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }

    .logo-icon {
      width: 32px; height: 32px;
      background: #2563EB;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .logo-icon svg { color: white; }

    .logo-text {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px; font-weight: 800;
      color: #fff; letter-spacing: -0.3px;
    }
    .logo-text span { color: #60A5FA; }

    .logo-sub {
      font-size: 9.5px; font-weight: 500;
      color: #475569; text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .nav-section { padding: 10px 10px 6px; flex: 1; }

    .nav-label {
      font-size: 10px; font-weight: 600;
      color: #334155;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 0 8px; margin: 14px 0 4px;
    }

    .nav-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 10px; border-radius: 8px;
      font-size: 13px; font-weight: 500;
      color: #64748B; text-decoration: none;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
      margin-bottom: 1px;
    }
    .nav-item:hover { background: rgba(255,255,255,0.05); color: #CBD5E1; }
    .nav-item.active-link {
      background: rgba(37,99,235,0.15);
      color: #FFFFFF; font-weight: 600;
    }
    .nav-item .icon-wrap {
      width: 18px; height: 18px;
      flex-shrink: 0; display: flex; align-items: center; justify-content: center;
      opacity: 0.7;
    }
    .nav-item.active-link .icon-wrap { opacity: 1; }

    .nav-badge {
      margin-left: auto;
      background: #DC2626; color: white;
      font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 99px;
      min-width: 18px; text-align: center;
    }

    .sidebar-footer {
      padding: 12px 10px;
      border-top: 1px solid rgba(255,255,255,0.06);
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
