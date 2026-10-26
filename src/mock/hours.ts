import type { DayHours, WeeklyHours } from '@/types';

const day = (opensAt: string, closesAt: string, open = true): DayHours => ({ open, opensAt, closesAt });

const CLOSED: DayHours = { open: false, opensAt: '09:00', closesAt: '18:00' };

/** Standard shop week used as the base for locations, barbers and settings. */
export const STANDARD_HOURS: WeeklyHours = {
  monday: day('09:00', '19:00'),
  tuesday: day('09:00', '19:00'),
  wednesday: day('09:00', '19:00'),
  thursday: day('09:00', '20:00'),
  friday: day('09:00', '20:00'),
  saturday: day('09:00', '18:00'),
  sunday: CLOSED,
};

export const EXTENDED_HOURS: WeeklyHours = {
  monday: day('08:00', '20:00'),
  tuesday: day('08:00', '20:00'),
  wednesday: day('08:00', '20:00'),
  thursday: day('08:00', '21:00'),
  friday: day('08:00', '21:00'),
  saturday: day('08:00', '19:00'),
  sunday: day('10:00', '16:00'),
};

/** Part-time barber pattern — Monday and Sunday off. */
export const PART_TIME_HOURS: WeeklyHours = {
  monday: CLOSED,
  tuesday: day('10:00', '18:00'),
  wednesday: day('10:00', '18:00'),
  thursday: day('11:00', '20:00'),
  friday: day('11:00', '20:00'),
  saturday: day('09:00', '17:00'),
  sunday: CLOSED,
};

export const cloneHours = (hours: WeeklyHours): WeeklyHours =>
  JSON.parse(JSON.stringify(hours)) as WeeklyHours;
