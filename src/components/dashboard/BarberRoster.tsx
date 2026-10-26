import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { BarberStatusBadge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Loading';
import { useSettings } from '@/context/SettingsContext';
import type { Barber, BarberStats } from '@/types';

export interface BarberRosterProps {
  barbers: Barber[] | undefined;
  stats: BarberStats[] | undefined;
  loading: boolean;
}

/** Compact "who is on the floor" panel for the dashboard sidebar column. */
export function BarberRoster({ barbers, stats, loading }: BarberRosterProps) {
  const { formatMoney } = useSettings();
  const statsById = new Map((stats ?? []).map((entry) => [entry.barberId, entry]));

  return (
    <Card padded={false}>
      <div className="p-5 pb-3">
        <CardHeader
          title="Barbers on the floor"
          description="Today's chairs at a glance"
          action={
            <Link to="/barbers">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                All
              </Button>
            </Link>
          }
        />
      </div>

      <ul className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
        {loading &&
          Array.from({ length: 4 }).map((_, index) => (
            <li key={index} className="flex items-center gap-3 px-5 py-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}

        {!loading &&
          barbers?.map((barber) => {
            const stat = statsById.get(barber.id);
            return (
              <li key={barber.id}>
                <Link
                  to={`/barbers/${barber.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.04]"
                >
                  <Avatar
                    name={barber.name}
                    src={barber.avatarUrl}
                    size="sm"
                    ringColor={barber.color}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {barber.name}
                    </p>
                    <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">
                      {stat ? `${stat.appointmentsToday} today · ${formatMoney(stat.revenueToday)}` : barber.specialization}
                    </p>
                  </div>
                  <BarberStatusBadge status={barber.status} size="sm" />
                </Link>
              </li>
            );
          })}
      </ul>
    </Card>
  );
}
