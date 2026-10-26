import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  isTomorrow,
  isYesterday,
  parse,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { WEEKDAY_BY_INDEX } from '@/constants/domain';
import type { DateRangeKey, ISODate, TimeString, WeekdayKey } from '@/types';

/* -------------------------------------------------------------------------- */
/* Parsing / serialising                                                       */
/* -------------------------------------------------------------------------- */

/** `yyyy-MM-dd` — the wire format used by every date field in the API. */
export const DATE_KEY = 'yyyy-MM-dd';

export function toISODate(date: Date): ISODate {
  return format(date, DATE_KEY);
}

/** Parses `yyyy-MM-dd` in local time (avoids the UTC shift `new Date(str)` causes). */
export function fromISODate(value: ISODate): Date {
  return parse(value, DATE_KEY, new Date());
}

/** Combines an ISO date and `HH:mm` into a local `Date`. */
export function toDateTime(date: ISODate, time: TimeString): Date {
  return parse(`${date} ${time}`, `${DATE_KEY} HH:mm`, new Date());
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function weekdayKeyOf(date: Date): WeekdayKey {
  return WEEKDAY_BY_INDEX[date.getDay()];
}

/* -------------------------------------------------------------------------- */
/* Display formatting                                                          */
/* -------------------------------------------------------------------------- */

/** `10:00` → `10:00 AM`. Falls through unchanged when already 12h. */
export function formatTime(time: TimeString, use12h = true): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  if (!use12h) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

/** `2026-08-16` → `Aug 16, 2026`. */
export function formatDate(value: ISODate | Date, pattern = 'MMM d, yyyy'): string {
  const date = typeof value === 'string' ? fromISODate(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  return format(date, pattern);
}

export function formatLongDate(value: ISODate | Date): string {
  return formatDate(value, 'EEEE, MMMM d, yyyy');
}

/** "Today" / "Tomorrow" / "Yesterday", else the short date. */
export function formatRelativeDay(value: ISODate | Date): string {
  const date = typeof value === 'string' ? fromISODate(value) : value;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

/** `2026-08-16T09:12:00Z` → `2 hours ago`. */
export function formatTimeAgo(iso: string): string {
  const date = parseISO(iso);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = differenceInMinutes(new Date(), date);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return format(date, 'MMM d, yyyy');
}

/** `95` → `1h 35m`. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} hr` : `${hours}h ${rest}m`;
}

/* -------------------------------------------------------------------------- */
/* Time arithmetic                                                             */
/* -------------------------------------------------------------------------- */

export function timeToMinutes(time: TimeString): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function minutesToTime(minutes: number): TimeString {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutesToTime(time: TimeString, minutes: number): TimeString {
  return minutesToTime(timeToMinutes(time) + minutes);
}

/** Half-open overlap test — `[startA, endA)` against `[startB, endB)`. */
export function timeRangesOverlap(
  startA: TimeString,
  endA: TimeString,
  startB: TimeString,
  endB: TimeString,
): boolean {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

/** Builds the `HH:mm` grid between two times at a fixed interval. */
export function buildTimeSlots(
  opensAt: TimeString,
  closesAt: TimeString,
  intervalMinutes: number,
): TimeString[] {
  const slots: TimeString[] = [];
  const end = timeToMinutes(closesAt);
  for (let m = timeToMinutes(opensAt); m < end; m += intervalMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/* -------------------------------------------------------------------------- */
/* Ranges                                                                      */
/* -------------------------------------------------------------------------- */

export interface DateRange {
  from: ISODate;
  to: ISODate;
}

/** Resolves a report/dashboard range key to concrete inclusive ISO bounds. */
export function resolveDateRange(key: DateRangeKey, reference = new Date()): DateRange {
  switch (key) {
    case 'today':
      return { from: toISODate(reference), to: toISODate(reference) };
    case 'week':
      return {
        from: toISODate(startOfWeek(reference, { weekStartsOn: 1 })),
        to: toISODate(endOfWeek(reference, { weekStartsOn: 1 })),
      };
    case 'month':
      return { from: toISODate(startOfMonth(reference)), to: toISODate(endOfMonth(reference)) };
    case 'quarter':
      return { from: toISODate(addDays(reference, -89)), to: toISODate(reference) };
    case 'year':
    default:
      return { from: toISODate(addDays(reference, -364)), to: toISODate(reference) };
  }
}

/** Every date in `[from, to]`, inclusive. */
export function eachISODateInRange(range: DateRange): ISODate[] {
  const out: ISODate[] = [];
  let cursor = fromISODate(range.from);
  const end = fromISODate(range.to);
  while (cursor <= end) {
    out.push(toISODate(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

/** The seven dates of the week containing `date`, Monday first. */
export function weekDays(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Six-week grid (42 cells) covering the month containing `date`. */
export function monthGrid(date: Date): Date[] {
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export { addDays, addMinutes, isSameDay, isToday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format };
