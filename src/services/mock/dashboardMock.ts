import type { DashboardRepository } from '../contracts';
import type {
  Appointment,
  BarberRevenuePoint,
  CustomerGrowthPoint,
  DashboardSummary,
  DateRangeKey,
  ID,
  MetricDelta,
  PopularService,
  ReportsData,
  RevenuePoint,
} from '@/types';
import { db } from '@/mock/db';
import { APPOINTMENT_STATUS_META } from '@/constants/domain';
import {
  addDays,
  eachISODateInRange,
  format,
  fromISODate,
  resolveDateRange,
  timeToMinutes,
  toISODate,
  todayISO,
} from '@/utils/datetime';
import { percentChange, sum } from '@/utils/helpers';
import { latency, toDetail } from './mockUtils';

/** Statuses that count towards money in the till (or promised to be). */
function earnsRevenue(appointment: Appointment): boolean {
  return appointment.status === 'completed' || appointment.status === 'confirmed';
}

function scoped(locationId?: ID): Appointment[] {
  return locationId
    ? db.appointments.filter((appointment) => appointment.locationId === locationId)
    : db.appointments;
}

function onDate(appointments: Appointment[], date: string): Appointment[] {
  return appointments.filter((appointment) => appointment.date === date);
}

function inRange(appointments: Appointment[], from: string, to: string): Appointment[] {
  return appointments.filter((appointment) => appointment.date >= from && appointment.date <= to);
}

function delta(value: number, previous: number, comparisonLabel: string): MetricDelta {
  return { value, changePercent: percentChange(value, previous), comparisonLabel };
}

/* -------------------------------------------------------------------------- */
/* Revenue series                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Buckets appointments into chart points. The bucket width follows the range so
 * every chart stays readable: hours for a day, days for a week or month, weeks
 * for a quarter and months for a year.
 */
function buildRevenueSeries(appointments: Appointment[], range: DateRangeKey): RevenuePoint[] {
  const { from, to } = resolveDateRange(range);
  const windowed = inRange(appointments, from, to);

  if (range === 'today') {
    const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 08:00 → 20:00
    return hours.map((hour) => {
      const bucket = windowed.filter((appointment) => {
        const minutes = timeToMinutes(appointment.startTime);
        return minutes >= hour * 60 && minutes < (hour + 1) * 60;
      });
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return {
        label: `${hour12} ${period}`,
        date: from,
        revenue: sum(bucket.filter(earnsRevenue), (appointment) => appointment.price),
        appointments: bucket.length,
      };
    });
  }

  if (range === 'year') {
    const start = fromISODate(from);
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const prefix = format(month, 'yyyy-MM');
      const bucket = windowed.filter((appointment) => appointment.date.startsWith(prefix));
      return {
        label: format(month, 'MMM'),
        date: `${prefix}-01`,
        revenue: sum(bucket.filter(earnsRevenue), (appointment) => appointment.price),
        appointments: bucket.length,
      };
    });
  }

  if (range === 'quarter') {
    const start = fromISODate(from);
    return Array.from({ length: 13 }, (_, i) => {
      const weekStart = addDays(start, i * 7);
      const weekEnd = addDays(weekStart, 6);
      const bucket = inRange(windowed, toISODate(weekStart), toISODate(weekEnd));
      return {
        label: format(weekStart, 'MMM d'),
        date: toISODate(weekStart),
        revenue: sum(bucket.filter(earnsRevenue), (appointment) => appointment.price),
        appointments: bucket.length,
      };
    });
  }

  // week / month — one point per day
  const labelPattern = range === 'week' ? 'EEE' : 'd MMM';
  return eachISODateInRange({ from, to }).map((date) => {
    const bucket = onDate(windowed, date);
    return {
      label: format(fromISODate(date), labelPattern),
      date,
      revenue: sum(bucket.filter(earnsRevenue), (appointment) => appointment.price),
      appointments: bucket.length,
    };
  });
}

function buildPopularServices(appointments: Appointment[], limit: number): PopularService[] {
  const counts = new Map<string, { bookings: number; revenue: number }>();

  for (const appointment of appointments) {
    if (appointment.status === 'cancelled') continue;
    const entry = counts.get(appointment.serviceId) ?? { bookings: 0, revenue: 0 };
    entry.bookings += 1;
    if (earnsRevenue(appointment)) entry.revenue += appointment.price;
    counts.set(appointment.serviceId, entry);
  }

  return db.services
    .map<PopularService>((service) => {
      const entry = counts.get(service.id) ?? { bookings: 0, revenue: 0 };
      return {
        serviceId: service.id,
        name: service.name,
        price: service.price,
        duration: service.duration,
        bookings: entry.bookings,
        revenue: entry.revenue,
        category: service.category,
      };
    })
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, limit);
}

function buildRevenueByBarber(appointments: Appointment[]): BarberRevenuePoint[] {
  return db.barbers
    .map<BarberRevenuePoint>((barber) => {
      const own = appointments.filter((appointment) => appointment.barberId === barber.id);
      return {
        barberId: barber.id,
        name: barber.name,
        revenue: sum(own.filter(earnsRevenue), (appointment) => appointment.price),
        appointments: own.filter((appointment) => appointment.status !== 'cancelled').length,
      };
    })
    .filter((point) => point.appointments > 0)
    .sort((a, b) => b.revenue - a.revenue);
}

function buildCustomerGrowth(range: DateRangeKey): CustomerGrowthPoint[] {
  const { from } = resolveDateRange(range);
  const start = fromISODate(from);
  const months = range === 'year' || range === 'quarter' ? (range === 'year' ? 12 : 3) : 6;

  return Array.from({ length: months }, (_, i) => {
    const month = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const prefix = format(month, 'yyyy-MM');
    const newCustomers = db.customers.filter((customer) => customer.joinedAt.startsWith(prefix)).length;
    const returningCustomers = new Set(
      db.appointments
        .filter((appointment) => appointment.date.startsWith(prefix) && appointment.status === 'completed')
        .map((appointment) => appointment.customerId),
    ).size;

    return { label: format(month, 'MMM yy'), newCustomers, returningCustomers };
  });
}

/* -------------------------------------------------------------------------- */
/* Repository                                                                  */
/* -------------------------------------------------------------------------- */

export const mockDashboardRepository: DashboardRepository = {
  async getSummary(locationId?: ID): Promise<DashboardSummary> {
    await latency();

    const appointments = scoped(locationId);
    const today = todayISO();
    const yesterday = toISODate(addDays(fromISODate(today), -1));

    const todays = onDate(appointments, today).filter(
      (appointment) => appointment.status !== 'cancelled',
    );
    const yesterdays = onDate(appointments, yesterday).filter(
      (appointment) => appointment.status !== 'cancelled',
    );

    // New customers: this calendar week vs the one before.
    const weekStart = toISODate(addDays(fromISODate(today), -6));
    const previousWeekStart = toISODate(addDays(fromISODate(today), -13));
    const joinedBetween = (from: string, to: string) =>
      db.customers.filter((customer) => {
        if (locationId && customer.locationId !== locationId) return false;
        const joined = customer.joinedAt.slice(0, 10);
        return joined >= from && joined <= to;
      }).length;

    const barbers = db.barbers.filter((barber) => !locationId || barber.locationId === locationId);

    return {
      appointmentsToday: delta(todays.length, yesterdays.length, 'compared to yesterday'),
      revenueToday: delta(
        sum(todays.filter(earnsRevenue), (appointment) => appointment.price),
        sum(yesterdays.filter(earnsRevenue), (appointment) => appointment.price),
        'compared to yesterday',
      ),
      newCustomers: delta(
        joinedBetween(weekStart, today),
        joinedBetween(previousWeekStart, toISODate(addDays(fromISODate(today), -7))),
        'this week',
      ),
      barbersAvailable: {
        available: barbers.filter((barber) => barber.status === 'available' || barber.status === 'busy')
          .length,
        total: barbers.length,
      },
    };
  },

  async getRevenue(range: DateRangeKey, locationId?: ID) {
    await latency();
    return buildRevenueSeries(scoped(locationId), range);
  },

  async getTodaySchedule(locationId?: ID) {
    await latency();
    return onDate(scoped(locationId), todayISO())
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(toDetail);
  },

  async getPopularServices(limit = 4, locationId?: ID) {
    await latency();
    const { from, to } = resolveDateRange('month');
    return buildPopularServices(inRange(scoped(locationId), from, to), limit);
  },

  async getReports(range: DateRangeKey, locationId?: ID): Promise<ReportsData> {
    await latency();

    const appointments = scoped(locationId);
    const { from, to } = resolveDateRange(range);
    const current = inRange(appointments, from, to);

    // Compare against the immediately preceding window of the same length.
    const spanDays = eachISODateInRange({ from, to }).length;
    const previousTo = toISODate(addDays(fromISODate(from), -1));
    const previousFrom = toISODate(addDays(fromISODate(previousTo), -(spanDays - 1)));
    const previous = inRange(appointments, previousFrom, previousTo);

    const revenueOf = (items: Appointment[]) =>
      sum(items.filter(earnsRevenue), (appointment) => appointment.price);
    const countOf = (items: Appointment[]) =>
      items.filter((appointment) => appointment.status !== 'cancelled').length;
    const averageOf = (items: Appointment[]) => {
      const billable = items.filter(earnsRevenue);
      return billable.length === 0 ? 0 : Math.round((revenueOf(items) / billable.length) * 100) / 100;
    };
    const newCustomersIn = (rangeFrom: string, rangeTo: string) =>
      db.customers.filter((customer) => {
        if (locationId && customer.locationId !== locationId) return false;
        const joined = customer.joinedAt.slice(0, 10);
        return joined >= rangeFrom && joined <= rangeTo;
      }).length;

    const comparisonLabel = 'vs previous period';

    return {
      summary: {
        totalRevenue: delta(revenueOf(current), revenueOf(previous), comparisonLabel),
        totalAppointments: delta(countOf(current), countOf(previous), comparisonLabel),
        averageAppointmentValue: delta(averageOf(current), averageOf(previous), comparisonLabel),
        newCustomers: delta(
          newCustomersIn(from, to),
          newCustomersIn(previousFrom, previousTo),
          comparisonLabel,
        ),
      },
      revenueByDay: buildRevenueSeries(appointments, range),
      revenueByBarber: buildRevenueByBarber(current),
      popularServices: buildPopularServices(current, 6),
      customerGrowth: buildCustomerGrowth(range),
      statusBreakdown: (Object.keys(APPOINTMENT_STATUS_META) as (keyof typeof APPOINTMENT_STATUS_META)[])
        .map((status) => ({
          status: APPOINTMENT_STATUS_META[status].label,
          count: current.filter((appointment) => appointment.status === status).length,
        }))
        .filter((entry) => entry.count > 0),
    };
  },
};
