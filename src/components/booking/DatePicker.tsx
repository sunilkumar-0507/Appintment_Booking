import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  addDays,
  format,
  fromISODate,
  isSameDay,
  isToday,
  monthGrid,
  toISODate,
  todayISO,
} from '@/utils/datetime';
import { WEEKDAYS } from '@/constants/domain';

export interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  /** Earliest selectable date, `yyyy-MM-dd`. Defaults to today. */
  minDate?: string;
  /** Latest selectable date, `yyyy-MM-dd`. */
  maxDate?: string;
  /** Weekday keys the shop is closed on — rendered disabled. */
  closedWeekdays?: number[];
  className?: string;
}

/** Month calendar used in both booking flows. Keyboard and touch friendly. */
export function DatePicker({
  value,
  onChange,
  minDate = todayISO(),
  maxDate,
  closedWeekdays = [],
  className,
}: DatePickerProps) {
  const [cursor, setCursor] = useState(() => (value ? fromISODate(value) : new Date()));

  const days = monthGrid(cursor);
  const currentMonth = cursor.getMonth();

  const isDisabled = (day: Date): boolean => {
    const key = toISODate(day);
    if (key < minDate) return true;
    if (maxDate && key > maxDate) return true;
    return closedWeekdays.includes(day.getDay());
  };

  return (
    <div className={cn('select-none', className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          aria-label="Previous month"
          className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-display text-sm font-semibold text-ink-900 dark:text-white">
          {format(cursor, 'MMMM yyyy')}
        </p>
        <button
          type="button"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          aria-label="Next month"
          className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday.key}
            className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400"
          >
            {weekday.short.slice(0, 2)}
          </div>
        ))}

        {days.map((day) => {
          const key = toISODate(day);
          const outside = day.getMonth() !== currentMonth;
          const disabled = isDisabled(day);
          const selected = value === key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              aria-current={isToday(day) ? 'date' : undefined}
              aria-pressed={selected}
              className={cn(
                'relative flex h-10 items-center justify-center rounded-xl text-[13px] font-medium tabular-nums transition-all duration-150',
                selected
                  ? 'bg-ink-900 text-white shadow-card dark:bg-gold-400 dark:text-ink-950'
                  : disabled
                    ? 'cursor-not-allowed text-ink-300 dark:text-ink-700'
                    : outside
                      ? 'text-ink-400 hover:bg-ink-100 dark:text-ink-600 dark:hover:bg-white/[0.06]'
                      : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/[0.08]',
              )}
            >
              {day.getDate()}
              {isToday(day) && !selected && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold-400" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Horizontal day strip — a faster pick on phones than a full month grid. */
export function DateStrip({
  value,
  onChange,
  days = 14,
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  days?: number;
  className?: string;
}) {
  const today = new Date();

  return (
    <div className={cn('no-scrollbar flex gap-2 overflow-x-auto pb-1', className)}>
      {Array.from({ length: days }).map((_, index) => {
        const day = addDays(today, index);
        const key = toISODate(day);
        const selected = key === value;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={selected}
            className={cn(
              'flex w-[62px] shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-all duration-150',
              selected
                ? 'border-gold-400 bg-gold-400 text-ink-950 shadow-card'
                : 'border-ink-200 bg-[rgb(var(--surface-card))] text-ink-600 hover:border-ink-300 dark:border-white/10 dark:text-ink-300 dark:hover:border-white/20',
            )}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              {isSameDay(day, today) ? 'Today' : format(day, 'EEE')}
            </span>
            <span className="font-display text-lg font-bold leading-none">{day.getDate()}</span>
            <span className="text-[10px] uppercase opacity-70">{format(day, 'MMM')}</span>
          </button>
        );
      })}
    </div>
  );
}
