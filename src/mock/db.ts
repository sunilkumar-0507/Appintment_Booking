import type {
  Appointment,
  AppSettings,
  Barber,
  Customer,
  CustomerStatus,
  Location,
  Service,
  User,
} from '@/types';
import { todayISO } from '@/utils/datetime';
import { sum } from '@/utils/helpers';
import { mockAppointments } from './appointments';
import { mockBarbers } from './barbers';
import { mockCustomers } from './customers';
import { mockLocations } from './locations';
import { mockServices } from './services';
import { defaultSettings } from './settings';
import { mockUsers } from './users';

/**
 * The demo's in-memory database. Every mock repository reads and writes these
 * arrays, so a booking made in the app is visible on the dashboard, in the
 * customer's history and in the reports — exactly as a real API would behave.
 *
 * Mutations live for the lifetime of the tab; a reload restores the seed.
 */
export interface MockDb {
  appointments: Appointment[];
  customers: Customer[];
  barbers: Barber[];
  services: Service[];
  locations: Location[];
  users: User[];
  settings: AppSettings;
}

/** Recomputes visit count, lifetime spend, last visit and tier for one customer. */
export function recalculateCustomer(customer: Customer, appointments: Appointment[]): Customer {
  const own = appointments.filter((appointment) => appointment.customerId === customer.id);
  const completed = own.filter((appointment) => appointment.status === 'completed');
  const totalVisits = completed.length;
  const totalSpent = sum(completed, (appointment) => appointment.price);

  const visitDates = completed.map((appointment) => appointment.date).sort();
  const lastVisit = visitDates.length > 0 ? visitDates[visitDates.length - 1] : undefined;

  const favouriteCounts = new Map<string, number>();
  for (const appointment of completed) {
    favouriteCounts.set(appointment.serviceId, (favouriteCounts.get(appointment.serviceId) ?? 0) + 1);
  }
  const favoriteServiceIds = [...favouriteCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([serviceId]) => serviceId);

  const today = todayISO();
  const joinedThisYear = customer.joinedAt.slice(0, 4) === today.slice(0, 4);

  let status: CustomerStatus;
  if (totalSpent >= 900 || totalVisits >= 30) status = 'vip';
  else if (totalVisits <= 1 && joinedThisYear) status = 'new';
  else if (lastVisit && lastVisit < shiftMonths(today, -6)) status = 'inactive';
  else if (totalVisits >= 5) status = 'returning';
  else status = 'active';

  return {
    ...customer,
    totalVisits,
    totalSpent,
    lastVisit,
    status,
    favoriteServiceIds: favoriteServiceIds.length > 0 ? favoriteServiceIds : customer.favoriteServiceIds,
  };
}

/** Naive month shift on a `yyyy-MM-dd` string — good enough for tier cutoffs. */
function shiftMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/** Recomputes lifetime booking counts on services from the ledger. */
function withBookingCounts(services: Service[], appointments: Appointment[]): Service[] {
  return services.map((service) => ({
    ...service,
    bookingCount: appointments.filter(
      (appointment) => appointment.serviceId === service.id && appointment.status === 'completed',
    ).length,
  }));
}

function seed(): MockDb {
  const appointments = mockAppointments.map((appointment) => ({ ...appointment }));
  return {
    appointments,
    customers: mockCustomers.map((customer) => recalculateCustomer(customer, appointments)),
    barbers: mockBarbers.map((barber) => ({ ...barber })),
    services: withBookingCounts(mockServices, appointments),
    locations: mockLocations.map((location) => ({ ...location })),
    users: mockUsers.map((user) => ({ ...user })),
    settings: JSON.parse(JSON.stringify(defaultSettings)) as AppSettings,
  };
}

export const db: MockDb = seed();

/** Re-derives every aggregate. Called after any write to the appointment ledger. */
export function refreshDerivedData(): void {
  db.customers = db.customers.map((customer) => recalculateCustomer(customer, db.appointments));
  db.services = withBookingCounts(db.services, db.appointments);
}
