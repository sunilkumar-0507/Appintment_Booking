import type { AppointmentRepository } from '../contracts';
import type {
  Appointment,
  AppointmentDetail,
  AppointmentFilters,
  AppointmentStatus,
  AvailabilityQuery,
  AvailabilitySlot,
  CreateAppointmentRequest,
  Customer,
  ID,
  PublicBookingRequest,
  RescheduleAppointmentRequest,
  UpdateAppointmentRequest,
} from '@/types';
import { db, refreshDerivedData } from '@/mock/db';
import { SLOT_INTERVAL_MINUTES } from '@/constants/config';
import {
  addMinutesToTime,
  buildTimeSlots,
  timeRangesOverlap,
  timeToMinutes,
  todayISO,
  fromISODate,
  weekdayKeyOf,
} from '@/utils/datetime';
import { generateId, generateReference, matchesQuery } from '@/utils/helpers';
import { apiError, isBlocking, latency, notFound, paginate, toDetail } from './mockUtils';

/* -------------------------------------------------------------------------- */
/* Availability                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Computes the bookable grid for one barber on one day. Shared by the admin
 * booking wizard, the reschedule flow and the public portal so all three agree
 * on what "available" means.
 */
function computeAvailability(query: AvailabilityQuery): AvailabilitySlot[] {
  const barber = db.barbers.find((entry) => entry.id === query.barberId);
  const service = db.services.find((entry) => entry.id === query.serviceId);
  if (!barber || !service) return [];

  const weekday = weekdayKeyOf(fromISODate(query.date));
  const hours = barber.workingHours[weekday];
  if (!hours.open) return [];

  const today = todayISO();
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const closingMinutes = timeToMinutes(hours.closesAt);

  const sameDayBookings = db.appointments.filter(
    (appointment) =>
      appointment.barberId === barber.id &&
      appointment.date === query.date &&
      appointment.id !== query.excludeAppointmentId &&
      isBlocking(appointment),
  );

  return buildTimeSlots(hours.opensAt, hours.closesAt, SLOT_INTERVAL_MINUTES).map((time) => {
    const endTime = addMinutesToTime(time, service.duration);

    if (timeToMinutes(endTime) > closingMinutes) {
      return { time, available: false, reason: 'closed' as const };
    }
    if (query.date < today || (query.date === today && timeToMinutes(time) <= nowMinutes)) {
      return { time, available: false, reason: 'past' as const };
    }
    const clash = sameDayBookings.some((appointment) =>
      timeRangesOverlap(time, endTime, appointment.startTime, appointment.endTime),
    );
    if (clash) {
      return { time, available: false, reason: 'booked' as const };
    }
    return { time, available: true };
  });
}

/** Rejects a write that would double-book a chair. */
function assertSlotFree(
  barberId: ID,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: ID,
): void {
  const clash = db.appointments.some(
    (appointment) =>
      appointment.barberId === barberId &&
      appointment.date === date &&
      appointment.id !== excludeId &&
      isBlocking(appointment) &&
      timeRangesOverlap(startTime, endTime, appointment.startTime, appointment.endTime),
  );
  if (clash) {
    throw apiError(409, 'That time slot has just been taken. Please pick another one.', {
      startTime: 'This barber is already booked at that time.',
    });
  }
}

/* -------------------------------------------------------------------------- */
/* Filtering                                                                   */
/* -------------------------------------------------------------------------- */

function applyFilters(items: AppointmentDetail[], filters: AppointmentFilters): AppointmentDetail[] {
  const {
    search,
    dateFrom,
    dateTo,
    barberId,
    serviceId,
    customerId,
    locationId,
    status,
    sortBy = 'date',
    sortDir = 'desc',
  } = filters;

  const filtered = items.filter((appointment) => {
    if (dateFrom && appointment.date < dateFrom) return false;
    if (dateTo && appointment.date > dateTo) return false;
    if (barberId && appointment.barberId !== barberId) return false;
    if (serviceId && appointment.serviceId !== serviceId) return false;
    if (customerId && appointment.customerId !== customerId) return false;
    if (locationId && appointment.locationId !== locationId) return false;
    if (status && status !== 'all' && appointment.status !== status) return false;
    if (search) {
      const haystack = [
        appointment.customerName,
        appointment.customerPhone,
        appointment.customerEmail,
        appointment.serviceName,
        appointment.barberName,
        appointment.reference,
      ].join(' ');
      if (!matchesQuery(haystack, search)) return false;
    }
    return true;
  });

  const direction = sortDir === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case 'customer':
        return a.customerName.localeCompare(b.customerName) * direction;
      case 'price':
        return (a.price - b.price) * direction;
      case 'status':
        return a.status.localeCompare(b.status) * direction;
      case 'date':
      default: {
        const left = `${a.date} ${a.startTime}`;
        const right = `${b.date} ${b.startTime}`;
        return left.localeCompare(right) * direction;
      }
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

function findOrThrow(id: ID): Appointment {
  const appointment = db.appointments.find((entry) => entry.id === id);
  if (!appointment) throw notFound('appointment');
  return appointment;
}

function validateCreate(payload: CreateAppointmentRequest): { endTime: string; price: number } {
  const fieldErrors: Record<string, string> = {};

  const customer = db.customers.find((entry) => entry.id === payload.customerId);
  const barber = db.barbers.find((entry) => entry.id === payload.barberId);
  const service = db.services.find((entry) => entry.id === payload.serviceId);

  if (!customer) fieldErrors.customerId = 'Select a customer.';
  if (!barber) fieldErrors.barberId = 'Select a barber.';
  if (!service) fieldErrors.serviceId = 'Select a service.';
  if (!payload.date) fieldErrors.date = 'Choose a date.';
  if (!payload.startTime) fieldErrors.startTime = 'Choose a time.';

  if (barber && service && !barber.serviceIds.includes(service.id)) {
    fieldErrors.barberId = `${barber.name} does not offer ${service.name}.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw apiError(422, 'Some of the details need fixing before we can save this.', fieldErrors);
  }

  return {
    endTime: addMinutesToTime(payload.startTime, service!.duration),
    price: service!.price,
  };
}

export const mockAppointmentRepository: AppointmentRepository = {
  async getAppointments(filters: AppointmentFilters = {}) {
    await latency();
    const detailed = db.appointments.map(toDetail);
    const filtered = applyFilters(detailed, filters);
    return paginate(filtered, filters.page ?? 1, filters.pageSize ?? 10);
  },

  async getAppointmentsInRange(from: string, to: string, filters: AppointmentFilters = {}) {
    await latency();
    const detailed = db.appointments.map(toDetail);
    return applyFilters(detailed, { ...filters, dateFrom: from, dateTo: to, sortDir: 'asc' });
  },

  async getAppointment(id: ID) {
    await latency();
    return toDetail(findOrThrow(id));
  },

  async createAppointment(payload: CreateAppointmentRequest) {
    await latency();
    const { endTime, price } = validateCreate(payload);
    assertSlotFree(payload.barberId, payload.date, payload.startTime, endTime);

    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: generateId('apt'),
      reference: generateReference(),
      customerId: payload.customerId,
      barberId: payload.barberId,
      serviceId: payload.serviceId,
      locationId: payload.locationId,
      date: payload.date,
      startTime: payload.startTime,
      endTime,
      status: payload.status ?? 'confirmed',
      price,
      source: payload.source ?? 'staff',
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };

    db.appointments.push(appointment);
    refreshDerivedData();
    return appointment;
  },

  async updateAppointment(id: ID, payload: UpdateAppointmentRequest) {
    await latency();
    const existing = findOrThrow(id);

    const merged: CreateAppointmentRequest = {
      customerId: payload.customerId ?? existing.customerId,
      barberId: payload.barberId ?? existing.barberId,
      serviceId: payload.serviceId ?? existing.serviceId,
      locationId: payload.locationId ?? existing.locationId,
      date: payload.date ?? existing.date,
      startTime: payload.startTime ?? existing.startTime,
      notes: payload.notes ?? existing.notes,
      status: payload.status ?? existing.status,
      source: payload.source ?? existing.source,
    };

    const { endTime, price } = validateCreate(merged);
    assertSlotFree(merged.barberId, merged.date, merged.startTime, endTime, id);

    Object.assign(existing, merged, {
      endTime,
      price,
      updatedAt: new Date().toISOString(),
    });

    refreshDerivedData();
    return { ...existing };
  },

  async deleteAppointment(id: ID) {
    await latency();
    const index = db.appointments.findIndex((entry) => entry.id === id);
    if (index === -1) throw notFound('appointment');
    db.appointments.splice(index, 1);
    refreshDerivedData();
  },

  async updateStatus(id: ID, status: AppointmentStatus) {
    await latency();
    const appointment = findOrThrow(id);
    appointment.status = status;
    appointment.updatedAt = new Date().toISOString();
    refreshDerivedData();
    return { ...appointment };
  },

  async reschedule(id: ID, payload: RescheduleAppointmentRequest) {
    await latency();
    const appointment = findOrThrow(id);
    const service = db.services.find((entry) => entry.id === appointment.serviceId);
    if (!service) throw notFound('service');

    const barberId = payload.barberId ?? appointment.barberId;
    const endTime = addMinutesToTime(payload.startTime, service.duration);
    assertSlotFree(barberId, payload.date, payload.startTime, endTime, id);

    appointment.barberId = barberId;
    appointment.date = payload.date;
    appointment.startTime = payload.startTime;
    appointment.endTime = endTime;
    // A reschedule always needs re-confirming, mirroring real shop practice.
    appointment.status = appointment.status === 'pending' ? 'pending' : 'confirmed';
    appointment.updatedAt = new Date().toISOString();

    refreshDerivedData();
    return { ...appointment };
  },

  async getAvailability(query: AvailabilityQuery) {
    await latency();
    return computeAvailability(query);
  },

  async createPublicBooking(payload: PublicBookingRequest) {
    await latency();

    const service = db.services.find((entry) => entry.id === payload.serviceId);
    if (!service) throw notFound('service');

    const endTime = addMinutesToTime(payload.startTime, service.duration);
    assertSlotFree(payload.barberId, payload.date, payload.startTime, endTime);

    // Match on email first — repeat customers should not be duplicated.
    const email = payload.customer.email.trim().toLowerCase();
    let customer: Customer | undefined = db.customers.find(
      (entry) => entry.email.toLowerCase() === email,
    );

    if (!customer) {
      const [firstName, ...rest] = payload.customer.fullName.trim().split(' ');
      const lastName = rest.join(' ') || '—';
      customer = {
        id: generateId('cus'),
        firstName,
        lastName,
        name: payload.customer.fullName.trim(),
        email: payload.customer.email.trim(),
        phone: payload.customer.phone.trim(),
        avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
          payload.customer.fullName,
        )}&backgroundColor=2c2c30&textColor=e3a534&radius=50`,
        status: 'new',
        locationId: payload.locationId,
        totalVisits: 0,
        totalSpent: 0,
        favoriteServiceIds: [payload.serviceId],
        preferredBarberId: payload.barberId,
        joinedAt: new Date().toISOString(),
      };
      db.customers.push(customer);
    }

    const now = new Date().toISOString();
    const appointment: Appointment = {
      id: generateId('apt'),
      reference: generateReference(),
      customerId: customer.id,
      barberId: payload.barberId,
      serviceId: payload.serviceId,
      locationId: payload.locationId,
      date: payload.date,
      startTime: payload.startTime,
      endTime,
      status: 'confirmed',
      price: service.price,
      source: 'online',
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };

    db.appointments.push(appointment);
    refreshDerivedData();
    return toDetail(appointment);
  },
};

export { computeAvailability };
