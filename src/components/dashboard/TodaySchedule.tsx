import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AppointmentDetail } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { AppointmentStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card, CardHeader } from '@/components/common/Card';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Skeleton } from '@/components/common/Loading';
import { useSettings } from '@/context/SettingsContext';
import { timeToMinutes } from '@/utils/datetime';
import type { ApiError } from '@/types';

export interface TodayScheduleProps {
  appointments: AppointmentDetail[] | undefined;
  loading: boolean;
  error?: ApiError;
  onRetry: () => void;
}

/** Vertical timeline of the day, with the next appointment marked. */
export function TodaySchedule({ appointments, loading, error, onRetry }: TodayScheduleProps) {
  const { formatTime, formatMoney } = useSettings();

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const upcoming = appointments?.find(
    (appointment) =>
      timeToMinutes(appointment.startTime) > nowMinutes &&
      (appointment.status === 'confirmed' || appointment.status === 'pending'),
  );

  return (
    <Card padded={false} className="flex h-full flex-col">
      <div className="p-5 pb-4">
        <CardHeader
          title="Today's Schedule"
          description={
            appointments
              ? `${appointments.length} appointment${appointments.length === 1 ? '' : 's'} booked`
              : undefined
          }
          action={
            <Link to="/calendar">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Calendar
              </Button>
            </Link>
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
        {loading && (
          <ul className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="flex items-center gap-3">
                <Skeleton className="h-3 w-16 shrink-0" />
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && error && <ErrorState error={error} onRetry={onRetry} compact title="Unable to load today's schedule" />}

        {!loading && !error && appointments?.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="Nothing booked today"
            description="The chairs are free. Add a walk-in or wait for an online booking to arrive."
            compact
            action={
              <Link to="/appointments/new">
                <Button size="sm" variant="accent" leftIcon={<Plus className="h-4 w-4" />}>
                  Create Appointment
                </Button>
              </Link>
            }
          />
        )}

        {!loading && !error && appointments && appointments.length > 0 && (
          <ol className="relative space-y-1">
            {/* Timeline rail */}
            <span
              className="absolute bottom-2 left-[4.55rem] top-2 w-px bg-ink-200 dark:bg-white/10"
              aria-hidden
            />

            {appointments.map((appointment) => {
              const isNext = appointment.id === upcoming?.id;
              const isPast = timeToMinutes(appointment.endTime) <= nowMinutes;

              return (
                <li key={appointment.id}>
                  <Link
                    to={`/appointments/${appointment.id}`}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-xl p-2 transition-colors',
                      'hover:bg-ink-50 dark:hover:bg-white/[0.04]',
                      isPast && appointment.status !== 'completed' && 'opacity-70',
                    )}
                  >
                    <span
                      className={cn(
                        'w-14 shrink-0 text-right text-[13px] font-semibold tabular-nums',
                        isNext ? 'text-gold-600 dark:text-gold-400' : 'text-ink-500 dark:text-ink-400',
                      )}
                    >
                      {formatTime(appointment.startTime)}
                    </span>

                    <span className="relative z-10 flex h-3 w-3 shrink-0 items-center justify-center">
                      <span
                        className={cn(
                          'h-2.5 w-2.5 rounded-full ring-4 ring-[rgb(var(--surface-card))]',
                          isNext && 'animate-pulse',
                        )}
                        style={{ backgroundColor: appointment.barberColor }}
                        aria-hidden
                      />
                    </span>

                    <Avatar
                      name={appointment.customerName}
                      src={appointment.customerAvatarUrl}
                      size="sm"
                      className="shrink-0"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                          {appointment.customerName}
                        </span>
                        {isNext && (
                          <span className="shrink-0 rounded-md bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                            Next
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">
                        {appointment.serviceName} · {appointment.barberName}
                      </span>
                    </span>

                    <span className="hidden shrink-0 text-sm font-semibold text-ink-700 sm:block dark:text-ink-200">
                      {formatMoney(appointment.price)}
                    </span>

                    <span className="shrink-0">
                      <AppointmentStatusBadge status={appointment.status} size="sm" withDot={false} />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
