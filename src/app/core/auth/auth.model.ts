export type UserRole =
  | 'Fleet Manager'
  | 'Dispatcher'
  | 'Driver'
  | 'Operations Manager'
  | 'Administrator'
  | 'Auditor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assetId?: string; // Driver's assigned vehicle/asset
  tenantId: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
}
