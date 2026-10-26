import type { ID } from './common';

export type CustomerStatus = 'new' | 'active' | 'returning' | 'vip' | 'inactive';

export interface Customer {
  id: ID;
  firstName: string;
  lastName: string;
  /** Convenience field kept in sync by the repositories. */
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  status: CustomerStatus;
  locationId: ID;
  totalVisits: number;
  totalSpent: number;
  /** ISO date of the most recent completed appointment, if any. */
  lastVisit?: string;
  favoriteServiceIds: ID[];
  preferredBarberId?: ID;
  notes?: string;
  joinedAt: string;
}

export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  locationId: ID;
  notes?: string;
  preferredBarberId?: ID;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest> & {
  status?: CustomerStatus;
};

export interface CustomerStats {
  total: number;
  newThisMonth: number;
  returning: number;
  vip: number;
}
