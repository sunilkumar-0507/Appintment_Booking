import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Scissors, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useSettings } from '@/context/SettingsContext';
import { formatDuration } from '@/utils/datetime';
import type { ApiError, PopularService } from '@/types';

export interface PopularServicesProps {
  services: PopularService[] | undefined;
  loading: boolean;
  error?: ApiError;
  onRetry: () => void;
}

export function PopularServices({ services, loading, error, onRetry }: PopularServicesProps) {
  const { formatMoney } = useSettings();

  // Bars are scaled against the busiest service so the ranking reads instantly.
  const maxBookings = Math.max(1, ...(services ?? []).map((service) => service.bookings));

  return (
    <Card padded={false}>
      <div className="p-5 pb-4">
        <CardHeader
          title="Popular Services"
          description="Most booked this month"
          action={
            <Link to="/services">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                All services
              </Button>
            </Link>
          }
        />
      </div>

      <div className="px-5 pb-5">
        {loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-ink-200/70 p-4 dark:border-white/[0.07]">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="mt-3 h-6 w-16" />
                <Skeleton className="mt-3 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <ErrorState error={error} onRetry={onRetry} compact title="Unable to load services" />
        )}

        {!loading && !error && services?.length === 0 && (
          <EmptyState
            icon={Scissors}
            title="No bookings yet this month"
            description="Service popularity appears here once appointments start coming in."
            compact
          />
        )}

        {!loading && !error && services && services.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {services.map((service, index) => (
              <li
                key={service.serviceId}
                className={cn(
                  'group rounded-xl border p-4 transition-all duration-200',
                  'border-ink-200/70 hover:-translate-y-0.5 hover:border-ink-300 hover:shadow-card',
                  'dark:border-white/[0.07] dark:hover:border-white/[0.14]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                    {service.name}
                  </p>
                  {index === 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-400/15 dark:text-gold-300">
                      <TrendingUp className="h-2.5 w-2.5" aria-hidden />
                      Top
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-xl font-bold text-ink-900 dark:text-white">
                    {formatMoney(service.price)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[13px] text-ink-500 dark:text-ink-400">
                    <Clock className="h-3 w-3" aria-hidden />
                    {formatDuration(service.duration)}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gold-400 transition-[width] duration-700 ease-out"
                      style={{ width: `${Math.max(6, (service.bookings / maxBookings) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">
                    <span className="font-semibold text-ink-700 dark:text-ink-200">{service.bookings}</span>{' '}
                    bookings
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
