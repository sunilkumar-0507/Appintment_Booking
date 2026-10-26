import { Link } from 'react-router-dom';
import { CalendarDays, Eye, Pencil, Power, Wallet } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Rating } from '@/components/common/Rating';
import { BarberStatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Menu } from '@/components/common/Menu';
import { Skeleton } from '@/components/common/Loading';
import { useSettings } from '@/context/SettingsContext';
import type { Barber, BarberStats } from '@/types';

export interface BarberCardProps {
  barber: Barber;
  stats?: BarberStats;
  statsLoading?: boolean;
  canManage: boolean;
  onEdit: (barber: Barber) => void;
  onSchedule: (barber: Barber) => void;
  onToggleActive: (barber: Barber) => void;
}

export function BarberCard({
  barber,
  stats,
  statsLoading,
  canManage,
  onEdit,
  onSchedule,
  onToggleActive,
}: BarberCardProps) {
  const { formatMoney } = useSettings();
  const disabled = barber.status === 'disabled';

  return (
    <Card className="flex flex-col">
      <div className="flex items-start gap-3.5">
        <Avatar name={barber.name} src={barber.avatarUrl} size="lg" ringColor={barber.color} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                to={`/barbers/${barber.id}`}
                className="block truncate font-semibold text-ink-900 hover:underline dark:text-white"
              >
                {barber.name}
              </Link>
              <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">{barber.specialization}</p>
            </div>
            {canManage && (
              <Menu
                buttonLabel={`Actions for ${barber.name}`}
                items={[
                  { label: 'View Profile', icon: <Eye className="h-4 w-4" />, onClick: () => onSchedule(barber) },
                  { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onClick: () => onEdit(barber) },
                  {
                    label: 'Schedule',
                    icon: <CalendarDays className="h-4 w-4" />,
                    onClick: () => onSchedule(barber),
                  },
                  {
                    label: disabled ? 'Enable' : 'Disable',
                    icon: <Power className="h-4 w-4" />,
                    onClick: () => onToggleActive(barber),
                    destructive: !disabled,
                    separated: true,
                  },
                ]}
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Rating value={barber.rating} reviewCount={barber.reviewCount} />
            <BarberStatusBadge status={barber.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Today's numbers */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl surface-muted p-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Today
          </span>
          {statsLoading ? (
            <Skeleton className="mt-2 h-6 w-10" />
          ) : (
            <p className="mt-1 font-display text-xl font-bold text-ink-900 dark:text-white">
              {stats?.appointmentsToday ?? 0}
            </p>
          )}
        </div>

        <div className="rounded-xl surface-muted p-3">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <Wallet className="h-3.5 w-3.5" aria-hidden />
            Revenue
          </span>
          {statsLoading ? (
            <Skeleton className="mt-2 h-6 w-16" />
          ) : (
            <p className="mt-1 font-display text-xl font-bold text-ink-900 dark:text-white">
              {formatMoney(stats?.revenueToday ?? 0)}
            </p>
          )}
        </div>
      </div>

      {/* Chair utilisation */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] font-medium text-ink-400">
          <span>Chair {barber.chairNumber} utilisation</span>
          <span className="tabular-nums">{stats?.utilization ?? 0}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/[0.08]">
          <div
            className="h-full rounded-full transition-[width] duration-700 ease-out"
            style={{
              width: `${stats?.utilization ?? 0}%`,
              backgroundColor: barber.color,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2 border-t border-ink-200/70 pt-4 dark:border-white/[0.07]">
        <Link to={`/barbers/${barber.id}`} className="flex-1">
          <Button variant="outline" size="sm" fullWidth>
            View Profile
          </Button>
        </Link>
        <Link to={`/calendar?barberId=${barber.id}`} className="flex-1">
          <Button variant="ghost" size="sm" fullWidth leftIcon={<CalendarDays className="h-3.5 w-3.5" />}>
            Schedule
          </Button>
        </Link>
      </div>
    </Card>
  );
}
