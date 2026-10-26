import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Clock,
  Mail,
  MapPin,
  Phone,
  Users,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { StatCard } from '@/components/common/StatCard';
import { SkeletonCard } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSettings } from '@/context/SettingsContext';
import { barberRepository, locationRepository } from '@/services';
import { WEEKDAYS } from '@/constants/domain';
import { formatNumber } from '@/utils/currency';
import { sum } from '@/utils/helpers';
import { formatTime, weekdayKeyOf } from '@/utils/datetime';

export default function LocationsPage() {
  const { formatMoney } = useSettings();

  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const stats = useAsyncData(() => locationRepository.getLocationStats(), []);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);

  const statsById = useMemo(
    () => new Map((stats.data ?? []).map((entry) => [entry.locationId, entry])),
    [stats.data],
  );

  const totals = useMemo(
    () => ({
      branches: locations.data?.length ?? 0,
      barbers: barbers.data?.length ?? 0,
      appointments: sum(stats.data ?? [], (entry) => entry.appointmentCount),
      revenue: sum(stats.data ?? [], (entry) => entry.revenue),
    }),
    [locations.data, barbers.data, stats.data],
  );

  const todayKey = weekdayKeyOf(new Date());

  return (
    <>
      <PageHeader
        title="Locations"
        description="Every branch, its team and how it is performing."
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Branches"
          value={totals.branches}
          icon={Building2}
          accent="gold"
          loading={locations.loading}
        />
        <StatCard
          label="Total Barbers"
          value={totals.barbers}
          icon={Users}
          accent="blue"
          loading={barbers.loading}
        />
        <StatCard
          label="Appointments"
          value={formatNumber(totals.appointments)}
          icon={CalendarDays}
          caption="All time"
          accent="violet"
          loading={stats.loading}
        />
        <StatCard
          label="Total Revenue"
          value={formatMoney(totals.revenue, { notation: 'compact' })}
          icon={Wallet}
          caption="Completed appointments"
          accent="green"
          loading={stats.loading}
        />
      </section>

      <div className="mt-5">
        {locations.loading && !locations.data && (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonCard key={index} lines={4} />
            ))}
          </div>
        )}

        {locations.error && (
          <ErrorState
            error={locations.error}
            title="Unable to load locations."
            onRetry={locations.refetch}
            className="surface-card border-solid"
          />
        )}

        {locations.data?.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="No locations yet"
            description="Add a branch to start assigning barbers and taking bookings."
            className="surface-card border-solid"
          />
        )}

        {locations.data && locations.data.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {locations.data.map((location) => {
              const stat = statsById.get(location.id);
              const team = (barbers.data ?? []).filter((barber) => barber.locationId === location.id);
              const hours = location.openingHours[todayKey];

              return (
                <Card key={location.id} padded={false} className="overflow-hidden">
                  {/* Cover */}
                  <div className="relative h-32 bg-ink-900">
                    <img
                      src={location.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover opacity-70"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent" />
                    <div className="absolute inset-x-4 bottom-3 flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-lg font-bold text-white">
                          {location.name}
                        </h3>
                        <p className="truncate text-[13px] text-ink-300">
                          {location.city}, {location.country}
                        </p>
                      </div>
                      <Badge
                        size="sm"
                        className={
                          hours.open
                            ? 'bg-success-500/20 text-success-100 ring-1 ring-inset ring-success-500/30'
                            : 'bg-white/10 text-ink-200 ring-1 ring-inset ring-white/20'
                        }
                        dotClassName={hours.open ? 'bg-success-500' : 'bg-ink-400'}
                      >
                        {hours.open ? 'Open today' : 'Closed today'}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3">
                      <Stat label="Barbers" value={String(stat?.barberCount ?? team.length)} icon={Users} />
                      <Stat
                        label="Appointments"
                        value={formatNumber(stat?.appointmentCount ?? 0)}
                        icon={CalendarDays}
                      />
                      <Stat
                        label="Revenue"
                        value={formatMoney(stat?.revenue ?? 0, { notation: 'compact' })}
                        icon={Wallet}
                      />
                    </div>

                    <div className="mt-4 space-y-2 border-t border-ink-200/70 pt-4 dark:border-white/[0.07]">
                      <p className="flex items-start gap-2.5 text-[13px] text-ink-600 dark:text-ink-300">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                        {location.addressLine1}, {location.city} {location.postalCode}
                      </p>
                      <a
                        href={`tel:${location.phone}`}
                        className="flex items-center gap-2.5 text-[13px] text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                        {location.phone}
                      </a>
                      <a
                        href={`mailto:${location.email}`}
                        className="flex items-center gap-2.5 text-[13px] text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                        <span className="truncate">{location.email}</span>
                      </a>
                      <p className="flex items-center gap-2.5 text-[13px] text-ink-600 dark:text-ink-300">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden />
                        {hours.open
                          ? `Today ${formatTime(hours.opensAt)} – ${formatTime(hours.closesAt)}`
                          : 'Closed today'}
                      </p>
                    </div>

                    {/* Opening hours */}
                    <details className="group mt-4 border-t border-ink-200/70 pt-4 dark:border-white/[0.07]">
                      <summary className="cursor-pointer list-none text-[13px] font-medium text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white">
                        Opening hours
                        <span className="ml-1 text-ink-400 group-open:hidden">(show)</span>
                        <span className="ml-1 hidden text-ink-400 group-open:inline">(hide)</span>
                      </summary>
                      <ul className="mt-2.5 space-y-1">
                        {WEEKDAYS.map((weekday) => {
                          const day = location.openingHours[weekday.key];
                          return (
                            <li
                              key={weekday.key}
                              className="flex items-center justify-between text-[13px]"
                            >
                              <span className="text-ink-600 dark:text-ink-300">{weekday.label}</span>
                              <span className="tabular-nums text-ink-500 dark:text-ink-400">
                                {day.open
                                  ? `${formatTime(day.opensAt)} – ${formatTime(day.closesAt)}`
                                  : 'Closed'}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </details>

                    {/* Team */}
                    {team.length > 0 && (
                      <div className="mt-4 border-t border-ink-200/70 pt-4 dark:border-white/[0.07]">
                        <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                          Team
                        </p>
                        <ul className="flex flex-wrap gap-2">
                          {team.map((barber) => (
                            <li key={barber.id}>
                              <Link
                                to={`/barbers/${barber.id}`}
                                className="flex items-center gap-2 rounded-full border border-ink-200 py-1 pl-1 pr-3 transition-colors hover:border-ink-300 hover:bg-ink-50 dark:border-white/10 dark:hover:bg-white/[0.06]"
                              >
                                <Avatar
                                  name={barber.name}
                                  src={barber.avatarUrl}
                                  size="xs"
                                  ringColor={barber.color}
                                />
                                <span className="text-[13px] font-medium text-ink-700 dark:text-ink-200">
                                  {barber.name}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl surface-muted p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-ink-400" aria-hidden />
      <p className="mt-1.5 font-display text-lg font-bold leading-none text-ink-900 dark:text-white">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">{label}</p>
    </div>
  );
}
