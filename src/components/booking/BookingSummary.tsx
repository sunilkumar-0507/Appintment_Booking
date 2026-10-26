import type { ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Scissors, User, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useSettings } from '@/context/SettingsContext';
import { formatDuration, formatLongDate } from '@/utils/datetime';

export interface BookingSummaryData {
  customerName?: string;
  serviceName?: string;
  serviceDuration?: number;
  barberName?: string;
  locationName?: string;
  date?: string;
  startTime?: string;
  price?: number;
}

export interface BookingSummaryProps {
  data: BookingSummaryData;
  className?: string;
  title?: string;
  footer?: ReactNode;
}

/** Read-only recap shown on the confirmation step of both booking flows. */
export function BookingSummary({ data, className, title = 'Booking summary', footer }: BookingSummaryProps) {
  const { formatMoney, formatTime } = useSettings();

  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: User, label: 'Customer', value: data.customerName },
    { icon: Scissors, label: 'Service', value: data.serviceName },
    { icon: UserRound, label: 'Barber', value: data.barberName },
    { icon: MapPin, label: 'Location', value: data.locationName },
    { icon: CalendarDays, label: 'Date', value: data.date ? formatLongDate(data.date) : undefined },
    {
      icon: Clock,
      label: 'Time',
      value:
        data.startTime && data.serviceDuration
          ? `${formatTime(data.startTime)} · ${formatDuration(data.serviceDuration)}`
          : data.startTime
            ? formatTime(data.startTime)
            : undefined,
    },
  ].filter((row) => Boolean(row.value));

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-ink-200/70 dark:border-white/[0.07]', className)}>
      <div className="border-b border-ink-200/70 px-5 py-3.5 surface-muted dark:border-white/[0.07]">
        <p className="text-sm font-semibold text-ink-900 dark:text-white">{title}</p>
      </div>

      <dl className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-center gap-3 px-5 py-3">
              <Icon className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
              <dt className="w-24 shrink-0 text-[13px] text-ink-500 dark:text-ink-400">{row.label}</dt>
              <dd className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 dark:text-white">
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>

      {typeof data.price === 'number' && (
        <div className="flex items-center justify-between border-t border-ink-200/70 px-5 py-4 surface-muted dark:border-white/[0.07]">
          <span className="text-sm font-medium text-ink-600 dark:text-ink-300">Total</span>
          <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">
            {formatMoney(data.price)}
          </span>
        </div>
      )}

      {footer}
    </div>
  );
}
