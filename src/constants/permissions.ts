import type { Permission, UserRole } from '@/types';

/**
 * Role → capability map. Routes declare a required permission and `AuthContext`
 * answers with these sets, so adding a role never means touching page code.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'dashboard.view',
    'appointments.view',
    'appointments.viewOwn',
    'appointments.manage',
    'customers.view',
    'customers.manage',
    'barbers.view',
    'barbers.manage',
    'services.view',
    'services.manage',
    'locations.view',
    'locations.manage',
    'reports.view',
    'settings.manage',
  ],
  manager: [
    'dashboard.view',
    'appointments.view',
    'appointments.viewOwn',
    'appointments.manage',
    'customers.view',
    'customers.manage',
    'barbers.view',
    'barbers.manage',
    'services.view',
    'services.manage',
    'locations.view',
    'reports.view',
  ],
  barber: [
    'dashboard.view',
    'appointments.viewOwn',
    'customers.view',
    'services.view',
  ],
  receptionist: [
    'dashboard.view',
    'appointments.view',
    'appointments.manage',
    'customers.view',
    'customers.manage',
    'services.view',
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  barber: 'Barber',
  receptionist: 'Receptionist',
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Full access to every area of the shop, including settings and billing.',
  manager: 'Appointments, customers, barbers, services and reports.',
  barber: 'Their own appointments, schedule and customer history.',
  receptionist: 'Appointments and customers — day-to-day front desk work.',
};
