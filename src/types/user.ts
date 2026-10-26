import type { ID } from './common';

export type UserRole = 'admin' | 'manager' | 'barber' | 'receptionist';

/**
 * Every guardable capability in the product. Routes and UI affordances declare
 * the permission they need; roles map to a set of them in `constants/permissions`.
 */
export type Permission =
  | 'dashboard.view'
  | 'appointments.view'
  | 'appointments.viewOwn'
  | 'appointments.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'barbers.view'
  | 'barbers.manage'
  | 'services.view'
  | 'services.manage'
  | 'locations.view'
  | 'locations.manage'
  | 'reports.view'
  | 'settings.manage';

export interface User {
  id: ID;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
  /** Set when the account is also a barber, linking the login to a barber record. */
  barberId?: ID;
  locationId?: ID;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  shopName: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  /** Epoch milliseconds. */
  expiresAt: number;
}
