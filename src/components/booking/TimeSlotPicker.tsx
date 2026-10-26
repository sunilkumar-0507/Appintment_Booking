import { CalendarX2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AvailabilitySlot } from '@/types';
import { useSettings } from '@/context/SettingsContext';

export interface TimeSlotPickerProps {
  slots: AvailabilitySlot[];
  value: string;
  onChange: (time: string) => void;
  emptyMessage?: string;
  /** Hides slots that already passed rather than showing them disabled. */
  hidePast?: boolean;
}

/**
 * The slot grid used by both booking flows. Unavailable slots stay visible but
 * disabled so the customer can see how busy the day is, not just what is left.
 */
export function TimeSlotPicker({
  slots,
  value,
  onChange,
  emptyMessage = 'No times are available on this date.',
  hidePast = true,
}: TimeSlotPickerProps) {
  const { formatTime } = useSettings();

  const visible = hidePast ? slots.filter((slot) => slot.reason !== 'past') : slots;
  const anyAvailable = visible.some((slot) => slot.available);

  if (visible.length === 0 || !anyAvailable) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 p-8 text-center dark:border-white/10">
        <CalendarX2 className="h-5 w-5 text-ink-400" aria-hidden />
        <p className="text-sm text-ink-500 dark:text-ink-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Available times"
      className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
    >
      {visible.map((slot) => {
        const selected = slot.time === value;
        return (
          <button
            key={slot.time}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!slot.available}
            onClick={() => onChange(slot.time)}
            title={
              slot.available
                ? undefined
                : slot.reason === 'booked'
                  ? 'Already booked'
                  : slot.reason === 'closed'
                    ? 'Outside working hours'
                    : 'No longer available'
            }
            className={cn(
              'rounded-xl border px-2 py-2.5 text-[13px] font-medium tabular-nums transition-all duration-150',
              selected
                ? 'border-gold-400 bg-gold-400 text-ink-950 shadow-card'
                : slot.available
                  ? 'border-ink-200 bg-[rgb(var(--surface-card))] text-ink-700 hover:border-gold-300 hover:bg-gold-50 dark:border-white/10 dark:text-ink-200 dark:hover:border-gold-400/40 dark:hover:bg-gold-400/10'
                  : 'cursor-not-allowed border-ink-200/60 bg-ink-50 text-ink-300 line-through dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-ink-600',
            )}
          >
            {formatTime(slot.time)}
          </button>
        );
      })}
    </div>
  );
}
