import { Fragment } from 'react';
import { cn } from '@/utils/cn';
import type { AppointmentDetail } from '@/types';
import { CALENDAR_END_HOUR, CALENDAR_START_HOUR } from '@/constants/config';
import { useSettings } from '@/context/SettingsContext';
import {
  format,
  isSameDay,
  isToday,
  minutesToTime,
  monthGrid,
  timeToMinutes,
  toISODate,
  weekDays,
} from '@/utils/datetime';
import { WEEKDAYS } from '@/constants/domain';

const HOUR_HEIGHT = 64;
const TOTAL_MINUTES = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * 60;

export interface CalendarViewProps {
  date: Date;
  appointments: AppointmentDetail[];
  onSelect: (appointment: AppointmentDetail) => void;
  onSelectDate?: (date: Date) => void;
}

/** Vertical offset and height, in pixels, for an appointment block. */
function blockGeometry(appointment: AppointmentDetail) {
  const startMinutes = timeToMinutes(appointment.startTime) - CALENDAR_START_HOUR * 60;
  const duration = timeToMinutes(appointment.endTime) - timeToMinutes(appointment.startTime);
  return {
    top: (startMinutes / 60) * HOUR_HEIGHT,
    height: Math.max(22, (duration / 60) * HOUR_HEIGHT - 3),
  };
}

/**
 * Lays overlapping appointments side by side. Blocks are packed into the first
 * column that is free, so a double-booked chair reads clearly rather than
 * stacking on top of itself.
 */
function packColumns(appointments: AppointmentDetail[]) {
  const sorted = [...appointments].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );
  const columnEnds: number[] = [];
  const placements = new Map<string, number>();

  for (const appointment of sorted) {
    const start = timeToMinutes(appointment.startTime);
    const end = timeToMinutes(appointment.endTime);

    let column = columnEnds.findIndex((columnEnd) => columnEnd <= start);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(end);
    } else {
      columnEnds[column] = end;
    }
    placements.set(appointment.id, column);
  }

  return { placements, columnCount: Math.max(1, columnEnds.length) };
}

function HourGutter() {
  return (
    <div className="w-14 shrink-0 sm:w-16">
      {Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }).map((_, index) => (
        <div
          key={index}
          className="relative text-right"
          style={{ height: HOUR_HEIGHT }}
        >
          <span className="absolute -top-2 right-2 text-[11px] font-medium tabular-nums text-ink-400">
            <HourLabel hour={CALENDAR_START_HOUR + index} />
          </span>
        </div>
      ))}
    </div>
  );
}

function HourLabel({ hour }: { hour: number }) {
  const { formatTime } = useSettings();
  return <>{formatTime(minutesToTime(hour * 60))}</>;
}

function GridLines() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR }).map((_, index) => (
        <div
          key={index}
          className="border-t border-ink-200/70 dark:border-white/[0.06]"
          style={{ height: HOUR_HEIGHT }}
        />
      ))}
    </div>
  );
}

/** Red "now" line, drawn only when the column being rendered is today. */
function NowIndicator({ day }: { day: Date }) {
  if (!isToday(day)) return null;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes() - CALENDAR_START_HOUR * 60;
  if (minutes < 0 || minutes > TOTAL_MINUTES) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
      style={{ top: (minutes / 60) * HOUR_HEIGHT }}
      aria-hidden
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-danger-500" />
      <span className="h-px flex-1 bg-danger-500" />
    </div>
  );
}

function AppointmentBlock({
  appointment,
  onSelect,
  compact,
}: {
  appointment: AppointmentDetail;
  onSelect: (appointment: AppointmentDetail) => void;
  compact?: boolean;
}) {
  const { formatTime } = useSettings();
  const cancelled = appointment.status === 'cancelled';

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className={cn(
        'group h-full w-full overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left transition-all duration-150',
        'animate-fade-in hover:z-10 hover:shadow-float',
        cancelled && 'opacity-55',
      )}
      style={{
        borderLeftColor: appointment.barberColor,
        backgroundColor: `${appointment.barberColor}1f`,
      }}
    >
      <span
        className={cn(
          'block truncate text-[11px] font-semibold leading-tight text-ink-900 dark:text-white',
          cancelled && 'line-through',
        )}
      >
        {appointment.customerName}
      </span>
      {!compact && (
        <>
          <span className="block truncate text-[10px] leading-tight text-ink-600 dark:text-ink-300">
            {appointment.serviceName}
          </span>
          <span className="block truncate text-[10px] leading-tight tabular-nums text-ink-500 dark:text-ink-400">
            {formatTime(appointment.startTime)} · {appointment.barberName}
          </span>
        </>
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Day view                                                                    */
/* -------------------------------------------------------------------------- */

export function DayView({ date, appointments, onSelect }: CalendarViewProps) {
  const dayKey = toISODate(date);
  const todays = appointments.filter((appointment) => appointment.date === dayKey);
  const { placements, columnCount } = packColumns(todays);

  return (
    <div className="flex overflow-x-auto">
      <HourGutter />
      <div
        className="relative min-w-[280px] flex-1 border-l border-ink-200/70 dark:border-white/[0.06]"
        style={{ height: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT }}
      >
        <GridLines />
        <NowIndicator day={date} />

        {todays.map((appointment) => {
          const { top, height } = blockGeometry(appointment);
          const column = placements.get(appointment.id) ?? 0;
          const width = 100 / columnCount;

          return (
            <div
              key={appointment.id}
              className="absolute px-0.5"
              style={{
                top,
                height,
                left: `${column * width}%`,
                width: `${width}%`,
              }}
            >
              <AppointmentBlock appointment={appointment} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Week view                                                                   */
/* -------------------------------------------------------------------------- */

export function WeekView({ date, appointments, onSelect, onSelectDate }: CalendarViewProps) {
  const days = weekDays(date);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        {/* Day headers */}
        <div className="sticky top-0 z-20 flex border-b border-ink-200/70 bg-[rgb(var(--surface-card))] dark:border-white/[0.07]">
          <div className="w-14 shrink-0 sm:w-16" />
          {days.map((day) => (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate?.(day)}
              className={cn(
                'flex-1 border-l border-ink-200/70 py-2.5 text-center transition-colors hover:bg-ink-50 dark:border-white/[0.06] dark:hover:bg-white/[0.03]',
              )}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold',
                  isToday(day)
                    ? 'bg-ink-900 text-white dark:bg-gold-400 dark:text-ink-950'
                    : 'text-ink-800 dark:text-ink-100',
                )}
              >
                {day.getDate()}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex">
          <HourGutter />
          {days.map((day) => {
            const dayKey = toISODate(day);
            const todays = appointments.filter((appointment) => appointment.date === dayKey);
            const { placements, columnCount } = packColumns(todays);

            return (
              <div
                key={dayKey}
                className={cn(
                  'relative flex-1 border-l border-ink-200/70 dark:border-white/[0.06]',
                  isToday(day) && 'bg-gold-50/40 dark:bg-gold-400/[0.03]',
                )}
                style={{ height: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_HEIGHT }}
              >
                <GridLines />
                <NowIndicator day={day} />

                {todays.map((appointment) => {
                  const { top, height } = blockGeometry(appointment);
                  const column = placements.get(appointment.id) ?? 0;
                  const width = 100 / columnCount;

                  return (
                    <div
                      key={appointment.id}
                      className="absolute px-0.5"
                      style={{ top, height, left: `${column * width}%`, width: `${width}%` }}
                    >
                      <AppointmentBlock appointment={appointment} onSelect={onSelect} compact={height < 44} />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Month view                                                                  */
/* -------------------------------------------------------------------------- */

export function MonthView({ date, appointments, onSelect, onSelectDate }: CalendarViewProps) {
  const days = monthGrid(date);
  const currentMonth = date.getMonth();

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b border-ink-200/70 dark:border-white/[0.07]">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday.key}
              className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400"
            >
              {weekday.short}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const dayKey = toISODate(day);
            const todays = appointments
              .filter((appointment) => appointment.date === dayKey)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            const outside = day.getMonth() !== currentMonth;

            return (
              <Fragment key={dayKey}>
                <div
                  className={cn(
                    'min-h-[104px] border-b border-r border-ink-200/70 p-1.5 transition-colors dark:border-white/[0.06]',
                    index % 7 === 0 && 'border-l',
                    outside && 'surface-muted',
                    isSameDay(day, date) && 'ring-1 ring-inset ring-gold-400',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDate?.(day)}
                    className={cn(
                      'mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold transition-colors',
                      isToday(day)
                        ? 'bg-ink-900 text-white dark:bg-gold-400 dark:text-ink-950'
                        : outside
                          ? 'text-ink-400 hover:bg-ink-200 dark:text-ink-600'
                          : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/10',
                    )}
                  >
                    {day.getDate()}
                  </button>

                  <div className="space-y-0.5">
                    {todays.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} style={{ height: 20 }}>
                        <AppointmentBlock appointment={appointment} onSelect={onSelect} compact />
                      </div>
                    ))}
                    {todays.length > 3 && (
                      <button
                        type="button"
                        onClick={() => onSelectDate?.(day)}
                        className="w-full rounded px-1.5 text-left text-[10px] font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
                      >
                        +{todays.length - 3} more
                      </button>
                    )}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
