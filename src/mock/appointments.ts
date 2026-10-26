import type { Appointment, AppointmentSource, AppointmentStatus } from '@/types';
import {
  addDays,
  addMinutesToTime,
  buildTimeSlots,
  fromISODate,
  timeToMinutes,
  toISODate,
  weekdayKeyOf,
} from '@/utils/datetime';
import { seededRandom } from '@/utils/helpers';
import { mockBarbers } from './barbers';
import { mockCustomers } from './customers';
import { mockServices } from './services';

/** How far back and forward the demo ledger runs, relative to today. */
const HISTORY_DAYS = 365;
const FUTURE_DAYS = 21;
/** Beyond this many days in the past the generator thins the data out. */
const DENSE_WINDOW_DAYS = 90;

const SOURCES: AppointmentSource[] = ['online', 'phone', 'walk-in', 'staff'];

/** Busier at the end of the week — mirrors how a real shop fills up. */
const WEEKDAY_LOAD: Record<number, number> = {
  0: 0.35, // Sunday
  1: 0.45,
  2: 0.5,
  3: 0.55,
  4: 0.7,
  5: 0.78,
  6: 0.72,
};

/**
 * Builds the appointment ledger. Deterministic: a fixed seed means the demo
 * shows the same numbers on every reload, which matters when the app is being
 * presented to a customer.
 */
function generateAppointments(): Appointment[] {
  const random = seededRandom(20260816);
  const appointments: Appointment[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const activeBarbers = mockBarbers.filter((barber) => barber.status !== 'disabled');
  const serviceById = new Map(mockServices.map((service) => [service.id, service]));

  let sequence = 4100;

  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset += 1) {
    const date = addDays(today, offset);
    const dateKey = toISODate(date);
    const weekday = weekdayKeyOf(date);
    const isPast = offset < 0;
    const isFuture = offset > 0;

    // Thin out the deep history so the 12-month report has shape without
    // holding tens of thousands of records in memory.
    const densityScale = offset < -DENSE_WINDOW_DAYS ? 0.42 : 1;

    for (const barber of activeBarbers) {
      const hours = barber.workingHours[weekday];
      if (!hours.open) continue;

      const bookable = barber.serviceIds
        .map((id) => serviceById.get(id))
        .filter((service): service is NonNullable<typeof service> => Boolean(service) && service!.active);
      if (bookable.length === 0) continue;

      const load = (WEEKDAY_LOAD[date.getDay()] ?? 0.5) * densityScale;
      const slots = buildTimeSlots(hours.opensAt, hours.closesAt, 30);
      const closingMinutes = timeToMinutes(hours.closesAt);

      let index = 0;
      while (index < slots.length) {
        if (random() > load) {
          index += 1;
          continue;
        }

        const service = bookable[Math.floor(random() * bookable.length)];
        const startTime = slots[index];
        const endTime = addMinutesToTime(startTime, service.duration);
        if (timeToMinutes(endTime) > closingMinutes) break;

        // Customers registered at this branch, and only once they had joined.
        const candidates = mockCustomers.filter(
          (customer) =>
            customer.locationId === barber.locationId && fromISODate(dateKey) >= new Date(customer.joinedAt),
        );
        if (candidates.length === 0) break;

        // Regulars mostly return to the same chair.
        const loyal = candidates.filter((customer) => customer.preferredBarberId === barber.id);
        const pool = loyal.length > 0 && random() < 0.65 ? loyal : candidates;
        const customer = pool[Math.floor(random() * pool.length)];

        let status: AppointmentStatus;
        if (isPast) {
          const roll = random();
          status = roll < 0.88 ? 'completed' : roll < 0.95 ? 'cancelled' : 'no-show';
        } else if (isFuture) {
          const roll = random();
          status = roll < 0.72 ? 'confirmed' : roll < 0.96 ? 'pending' : 'cancelled';
        } else {
          // Today: everything already finished is done, the rest is upcoming.
          if (timeToMinutes(endTime) <= nowMinutes) {
            status = random() < 0.93 ? 'completed' : 'no-show';
          } else {
            status = random() < 0.68 ? 'confirmed' : 'pending';
          }
        }

        sequence += 1;
        const bookedAheadDays = Math.floor(random() * 12) + 1;
        const createdAt = addDays(fromISODate(dateKey), -bookedAheadDays).toISOString();

        appointments.push({
          id: `apt_${sequence}`,
          reference: `BF-${sequence}`,
          customerId: customer.id,
          barberId: barber.id,
          serviceId: service.id,
          locationId: barber.locationId,
          date: dateKey,
          startTime,
          endTime,
          status,
          price: service.price,
          source: SOURCES[Math.floor(random() * SOURCES.length)],
          notes: random() < 0.12 ? 'Regular client — usual style, no changes requested.' : undefined,
          createdAt,
          updatedAt: createdAt,
        });

        // Move past the booked slots, then leave a short breather now and then.
        index += Math.ceil(service.duration / 30) + (random() < 0.35 ? 1 : 0);
      }
    }
  }

  return appointments.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
  );
}

export const mockAppointments: Appointment[] = generateAppointments();
