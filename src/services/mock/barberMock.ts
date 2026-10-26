import type { BarberRepository } from '../contracts';
import type {
  Barber,
  BarberStats,
  CreateBarberRequest,
  ID,
  UpdateBarberRequest,
} from '@/types';
import { db } from '@/mock/db';
import { STANDARD_HOURS, cloneHours } from '@/mock/hours';
import { CHART_COLORS } from '@/constants/domain';
import {
  fromISODate,
  timeToMinutes,
  todayISO,
  weekdayKeyOf,
} from '@/utils/datetime';
import { clamp, generateId, matchesQuery, sum } from '@/utils/helpers';
import { computeAvailability } from './appointmentMock';
import { apiError, isBlocking, latency, notFound } from './mockUtils';

function findOrThrow(id: ID): Barber {
  const barber = db.barbers.find((entry) => entry.id === id);
  if (!barber) throw notFound('barber');
  return barber;
}

/** Derives today's and this month's performance for one barber. */
function statsFor(barber: Barber): BarberStats {
  const today = todayISO();
  const monthPrefix = today.slice(0, 7);
  const own = db.appointments.filter((appointment) => appointment.barberId === barber.id);

  const todays = own.filter((appointment) => appointment.date === today && isBlocking(appointment));
  const monthly = own.filter((appointment) => appointment.date.slice(0, 7) === monthPrefix);
  const monthlyCompleted = monthly.filter((appointment) => appointment.status === 'completed');
  const monthlyFinished = monthly.filter(
    (appointment) => appointment.status === 'completed' || appointment.status === 'no-show',
  );

  const weekday = weekdayKeyOf(fromISODate(today));
  const hours = barber.workingHours[weekday];
  const workingMinutes = hours.open ? timeToMinutes(hours.closesAt) - timeToMinutes(hours.opensAt) : 0;
  const bookedMinutes = sum(
    todays,
    (appointment) => timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime),
  );

  return {
    barberId: barber.id,
    appointmentsToday: todays.length,
    revenueToday: sum(todays, (appointment) => appointment.price),
    appointmentsThisMonth: monthlyCompleted.length,
    revenueThisMonth: sum(monthlyCompleted, (appointment) => appointment.price),
    completionRate:
      monthlyFinished.length === 0
        ? 100
        : Math.round((monthlyCompleted.length / monthlyFinished.length) * 100),
    utilization: workingMinutes === 0 ? 0 : clamp(Math.round((bookedMinutes / workingMinutes) * 100), 0, 100),
  };
}

export const mockBarberRepository: BarberRepository = {
  async getBarbers(params = {}) {
    await latency();
    const { locationId, search, serviceId } = params;

    return db.barbers
      .filter((barber) => {
        if (locationId && barber.locationId !== locationId) return false;
        if (serviceId && !barber.serviceIds.includes(serviceId)) return false;
        if (search && !matchesQuery(`${barber.name} ${barber.specialization} ${barber.email}`, search)) {
          return false;
        }
        return true;
      })
      .map((barber) => ({ ...barber }));
  },

  async getBarber(id: ID) {
    await latency();
    return { ...findOrThrow(id) };
  },

  async createBarber(payload: CreateBarberRequest) {
    await latency();

    const email = payload.email.trim().toLowerCase();
    if (db.barbers.some((entry) => entry.email.toLowerCase() === email)) {
      throw apiError(422, 'A barber with that email already exists.', {
        email: 'This email is already in use.',
      });
    }

    const barber: Barber = {
      id: generateId('brb'),
      name: payload.name.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      avatarUrl:
        payload.avatarUrl ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
          payload.name,
        )}&backgroundColor=f6f6f7,e7e7e9&radius=50`,
      specialization: payload.specialization,
      bio: payload.bio,
      experience: payload.experience,
      rating: 0,
      reviewCount: 0,
      locationId: payload.locationId,
      serviceIds: payload.serviceIds,
      workingHours: payload.workingHours ?? cloneHours(STANDARD_HOURS),
      status: payload.status,
      chairNumber: payload.chairNumber,
      color: CHART_COLORS[db.barbers.length % CHART_COLORS.length],
      reviews: [],
      joinedAt: new Date().toISOString(),
    };

    db.barbers.push(barber);
    return barber;
  },

  async updateBarber(id: ID, payload: UpdateBarberRequest) {
    await latency();
    const barber = findOrThrow(id);

    if (payload.email) {
      const email = payload.email.trim().toLowerCase();
      if (db.barbers.some((entry) => entry.id !== id && entry.email.toLowerCase() === email)) {
        throw apiError(422, 'A barber with that email already exists.', {
          email: 'This email is already in use.',
        });
      }
    }

    Object.assign(barber, payload);
    return { ...barber };
  },

  async deleteBarber(id: ID) {
    await latency();
    const index = db.barbers.findIndex((entry) => entry.id === id);
    if (index === -1) throw notFound('barber');

    const today = todayISO();
    const upcoming = db.appointments.filter(
      (appointment) =>
        appointment.barberId === id && appointment.date >= today && isBlocking(appointment),
    );

    if (upcoming.length > 0) {
      throw apiError(
        409,
        `This barber still has ${upcoming.length} upcoming appointment${
          upcoming.length === 1 ? '' : 's'
        }. Reassign or cancel them first.`,
      );
    }

    db.barbers.splice(index, 1);
  },

  async getBarberAvailability(id: ID, date: string, serviceId?: ID) {
    await latency();
    const barber = findOrThrow(id);
    // Without an explicit service, use the shortest one they offer so the grid
    // shows the finest-grained view of their free time.
    const resolvedServiceId =
      serviceId ??
      [...db.services]
        .filter((service) => barber.serviceIds.includes(service.id))
        .sort((a, b) => a.duration - b.duration)[0]?.id;

    if (!resolvedServiceId) return [];

    return computeAvailability({
      barberId: id,
      serviceId: resolvedServiceId,
      locationId: barber.locationId,
      date,
    });
  },

  async getBarberStats(id: ID) {
    await latency();
    return statsFor(findOrThrow(id));
  },

  async getAllBarberStats(locationId?: ID) {
    await latency();
    return db.barbers
      .filter((barber) => !locationId || barber.locationId === locationId)
      .map(statsFor);
  },
};
