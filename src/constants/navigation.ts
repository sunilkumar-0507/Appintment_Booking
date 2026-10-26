import {
  CalendarDays,
  CalendarRange,
  LayoutDashboard,
  MapPin,
  Scissors,
  Settings,
  BarChart3,
  Users,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Permission } from '@/types';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  permission: Permission;
  /** Shown in the mobile bottom bar (space is limited to five entries). */
  primary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view', primary: true },
  { label: 'Appointments', to: '/appointments', icon: CalendarDays, permission: 'appointments.viewOwn', primary: true },
  { label: 'Calendar', to: '/calendar', icon: CalendarRange, permission: 'appointments.viewOwn', primary: true },
  { label: 'Customers', to: '/customers', icon: Users, permission: 'customers.view', primary: true },
  { label: 'Barbers', to: '/barbers', icon: UserRound, permission: 'barbers.view' },
  { label: 'Services', to: '/services', icon: Scissors, permission: 'services.view' },
  { label: 'Locations', to: '/locations', icon: MapPin, permission: 'locations.view' },
  { label: 'Reports', to: '/reports', icon: BarChart3, permission: 'reports.view' },
  { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings.manage' },
];
