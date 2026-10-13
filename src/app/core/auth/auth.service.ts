import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { UserProfile, UserRole, AuthSession } from './auth.model';

const STORAGE_KEY = 'alm_auth_session';

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  'Fleet Manager': {
    id: 'USR-FM-01',
    name: 'David Adeleke',
    email: 'david.adeleke@fleet.ng',
    role: 'Fleet Manager',
    tenantId: 'TENANT-NG-01',
  },
  'Dispatcher': {
    id: 'USR-DISP-01',
    name: 'Kemi Oladipo',
    email: 'kemi.oladipo@fleet.ng',
    role: 'Dispatcher',
    tenantId: 'TENANT-NG-01',
  },
  'Driver': {
    id: 'DRV-001',
    name: 'John Okafor',
    email: 'j.okafor@fleet.ng',
    role: 'Driver',
    assetId: 'VEH-TRK-101',
    tenantId: 'TENANT-NG-01',
  },
  'Operations Manager': {
    id: 'USR-OPS-01',
    name: 'Chinedu Obi',
    email: 'chinedu.obi@fleet.ng',
    role: 'Operations Manager',
    tenantId: 'TENANT-NG-01',
  },
  'Administrator': {
    id: 'USR-ADMIN-01',
    name: 'Amina Bello (Admin)',
    email: 'admin@fleet.ng',
    role: 'Administrator',
    tenantId: 'TENANT-NG-01',
  },
  'Auditor': {
    id: 'USR-AUD-01',
    name: 'Tunde Bakare',
    email: 'audit@fleet.ng',
    role: 'Auditor',
    tenantId: 'TENANT-NG-01',
  },
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentSession = signal<AuthSession | null>(this.getInitialSession());

  readonly currentUser = computed(() => this.currentSession()?.user ?? null);
  readonly currentRole = computed(() => this.currentUser()?.role ?? null);
  readonly isAuthenticated = computed(() => !!this.currentSession()?.token);

  private getInitialSession(): AuthSession {
    if (this.isBrowser) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch {
        // Fallback to default user
      }
    }

    const defaultUser = DEFAULT_USERS['Fleet Manager'];
    return {
      token: 'jwt_mock_token_alm_' + defaultUser.id,
      user: defaultUser,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  setRole(role: UserRole): void {
    const user = DEFAULT_USERS[role];
    const session: AuthSession = {
      token: `jwt_mock_token_alm_${user.id}_${Date.now()}`,
      user,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    this.currentSession.set(session);
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }

  getToken(): string | null {
    return this.currentSession()?.token ?? null;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.currentRole();
    return !!role && roles.includes(role);
  }

  canAccess(feature: 'telemetry_view' | 'telemetry_report' | 'optimize_routes' | 'epod_submit' | 'epod_audit' | 'offline_sync'): boolean {
    const role = this.currentRole();
    if (!role) return false;

    switch (feature) {
      case 'telemetry_view':
        return ['Fleet Manager', 'Dispatcher', 'Operations Manager', 'Administrator'].includes(role);
      case 'telemetry_report':
        return ['Driver', 'Administrator'].includes(role);
      case 'optimize_routes':
        return ['Dispatcher', 'Operations Manager', 'Administrator'].includes(role);
      case 'epod_submit':
        return ['Driver', 'Administrator'].includes(role);
      case 'epod_audit':
        return ['Auditor', 'Operations Manager', 'Administrator'].includes(role);
      case 'offline_sync':
        return true; // Available to all authenticated mobile/web clients
      default:
        return false;
    }
  }
}
