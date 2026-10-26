import { MOCK_LATENCY_MS } from '@/constants/config';
import type { ApiError, Appointment, AppointmentDetail, Paginated } from '@/types';
import { db } from '@/mock/db';
import { sleep } from '@/utils/helpers';

/**
 * Simulated network latency. Every mock call goes through this so the loading
 * skeletons, spinners and disabled submit buttons are all exercised in the demo.
 */
export function latency(): Promise<void> {
  const { min, max } = MOCK_LATENCY_MS;
  return sleep(min + Math.random() * (max - min));
}

/** Throws the same normalised shape the Axios interceptors produce. */
export function apiError(status: number, message: string, fieldErrors?: Record<string, string>): ApiError {
  return { status, message, fieldErrors };
}

export function notFound(entity: string): ApiError {
  return apiError(404, `We could not find that ${entity}.`);
}

export function paginate<T>(items: T[], page = 1, pageSize = 10): Paginated<T> {
  // `pageSize = 0` is the "give me everything" convention shared with the REST layer.
  if (pageSize <= 0) {
    return { items, page: 1, pageSize: items.length, total: items.length, totalPages: 1 };
  }
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
}

/**
 * Joins an appointment with the customer, barber, service and location it
 * references. The REST API is expected to return this same expanded shape, so
 * components never resolve ids themselves.
 */
export function toDetail(appointment: Appointment): AppointmentDetail {
  const customer = db.customers.find((entry) => entry.id === appointment.customerId);
  const barber = db.barbers.find((entry) => entry.id === appointment.barberId);
  const service = db.services.find((entry) => entry.id === appointment.serviceId);
  const location = db.locations.find((entry) => entry.id === appointment.locationId);

  return {
    ...appointment,
    customerName: customer?.name ?? 'Unknown customer',
    customerPhone: customer?.phone ?? '',
    customerEmail: customer?.email ?? '',
    customerAvatarUrl: customer?.avatarUrl,
    barberName: barber?.name ?? 'Unassigned',
    barberAvatarUrl: barber?.avatarUrl ?? '',
    barberColor: barber?.color ?? '#88888f',
    serviceName: service?.name ?? 'Service',
    serviceDuration: service?.duration ?? 30,
    locationName: location?.name ?? 'Main branch',
  };
}

/** Statuses that still occupy a chair — used for conflict detection. */
export const BLOCKING_STATUSES = ['pending', 'confirmed', 'completed'] as const;

export function isBlocking(appointment: Appointment): boolean {
  return (BLOCKING_STATUSES as readonly string[]).includes(appointment.status);
}
