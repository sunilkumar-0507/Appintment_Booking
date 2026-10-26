import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Award,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Quote,
  Scissors,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Rating } from '@/components/common/Rating';
import { BarberStatusBadge } from '@/components/common/Badge';
import { Tabs } from '@/components/common/Tabs';
import { LoadingSpinner, PageLoader } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { BarberFormModal } from '@/components/barbers/BarberFormModal';
import { DateStrip } from '@/components/booking/DatePicker';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { barberRepository, locationRepository, serviceRepository } from '@/services';
import { WEEKDAYS } from '@/constants/domain';
import { formatDate, formatDuration, todayISO } from '@/utils/datetime';

type BarberTab = 'overview' | 'schedule' | 'services' | 'reviews';

export default function BarberDetailPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { formatMoney, formatTime } = useSettings();

  const [tab, setTab] = useState<BarberTab>('overview');
  const [scheduleDate, setScheduleDate] = useState(todayISO());
  const [editing, setEditing] = useState(false);

  const barber = useAsyncData(() => barberRepository.getBarber(id), [id]);
  const stats = useAsyncData(() => barberRepository.getBarberStats(id), [id]);
  const services = useAsyncData(() => serviceRepository.getServices(), []);
  const locations = useAsyncData(() => locationRepository.getLocations(), []);

  const availability = useAsyncData(
    () => barberRepository.getBarberAvailability(id, scheduleDate),
    [id, scheduleDate],
    { enabled: tab === 'schedule' },
  );

  if (barber.loading && !barber.data) return <PageLoader message="Loading barber profile…" />;

  if (barber.error || !barber.data) {
    return (
      <>
        <PageHeader title="Barber" backTo={{ to: '/barbers', label: 'Barbers' }} />
        <ErrorState
          error={barber.error}
          title="Unable to load this barber."
          onRetry={barber.refetch}
          className="surface-card border-solid"
        />
      </>
    );
  }

  const record = barber.data;
  const offered = (services.data ?? []).filter((service) => record.serviceIds.includes(service.id));
  const branch = locations.data?.find((location) => location.id === record.locationId);

  return (
    <>
      <PageHeader
        title={record.name}
        description={`${record.specialization} · Chair ${record.chairNumber}${branch ? ` · ${branch.name}` : ''}`}
        backTo={{ to: '/barbers', label: 'Barbers' }}
        actions={
          <>
            <Link to={`/calendar?barberId=${record.id}`}>
              <Button variant="outline" leftIcon={<CalendarDays className="h-4 w-4" />}>
                View Schedule
              </Button>
            </Link>
            {can('barbers.manage') && (
              <Button variant="accent" onClick={() => setEditing(true)} leftIcon={<Pencil className="h-4 w-4" />}>
                Edit Profile
              </Button>
            )}
          </>
        }
      />

      {/* Hero */}
      <Card className="mb-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={record.name} src={record.avatarUrl} size="xl" ringColor={record.color} />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">{record.name}</h2>
              <BarberStatusBadge status={record.status} />
            </div>
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{record.specialization}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-4">
              <Rating value={record.rating} reviewCount={record.reviewCount} size="md" />
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 dark:text-ink-400">
                <Award className="h-3.5 w-3.5" aria-hidden />
                {record.experience} years experience
              </span>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-64">
            <Metric
              icon={<CalendarDays className="h-3.5 w-3.5" />}
              label="Today"
              value={stats.loading ? '…' : String(stats.data?.appointmentsToday ?? 0)}
            />
            <Metric
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="Revenue"
              value={stats.loading ? '…' : formatMoney(stats.data?.revenueToday ?? 0)}
            />
          </div>
        </div>

        <p className="mt-5 border-t border-ink-200/70 pt-5 text-sm leading-relaxed text-ink-600 dark:border-white/[0.07] dark:text-ink-300">
          {record.bio}
        </p>
      </Card>

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'schedule', label: 'Availability' },
          { value: 'services', label: 'Services', count: offered.length },
          { value: 'reviews', label: 'Reviews', count: record.reviews.length },
        ]}
      />

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Performance" description="This month" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <BigMetric
                icon={<CalendarDays className="h-4 w-4" />}
                label="Appointments"
                value={String(stats.data?.appointmentsThisMonth ?? 0)}
                loading={stats.loading}
              />
              <BigMetric
                icon={<Wallet className="h-4 w-4" />}
                label="Revenue"
                value={formatMoney(stats.data?.revenueThisMonth ?? 0)}
                loading={stats.loading}
              />
              <BigMetric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Completion rate"
                value={`${stats.data?.completionRate ?? 0}%`}
                loading={stats.loading}
              />
              <BigMetric
                icon={<Scissors className="h-4 w-4" />}
                label="Utilisation today"
                value={`${stats.data?.utilization ?? 0}%`}
                loading={stats.loading}
              />
            </div>

            <div className="mt-6 border-t border-ink-200/70 pt-5 dark:border-white/[0.07]">
              <p className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">Weekly schedule</p>
              <ul className="grid gap-2 sm:grid-cols-2">
                {WEEKDAYS.map((weekday) => {
                  const hours = record.workingHours[weekday.key];
                  return (
                    <li
                      key={weekday.key}
                      className="flex items-center justify-between rounded-xl surface-muted px-3.5 py-2.5"
                    >
                      <span className="text-[13px] font-medium text-ink-700 dark:text-ink-200">
                        {weekday.label}
                      </span>
                      <span className="text-[13px] tabular-nums text-ink-500 dark:text-ink-400">
                        {hours.open
                          ? `${formatTime(hours.opensAt)} – ${formatTime(hours.closesAt)}`
                          : 'Day off'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader title="Contact" />
            <div className="mt-4 space-y-2.5">
              <a
                href={`tel:${record.phone}`}
                className="flex items-center gap-2.5 text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                {record.phone}
              </a>
              <a
                href={`mailto:${record.email}`}
                className="flex items-center gap-2.5 text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                <span className="truncate">{record.email}</span>
              </a>
              {branch && (
                <p className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                  {branch.name}, {branch.city}
                </p>
              )}
              <p className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                Joined {formatDate(record.joinedAt.slice(0, 10))}
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Availability */}
      {tab === 'schedule' && (
        <Card>
          <CardHeader
            title="Availability"
            description="Open slots based on this barber's working hours and existing bookings."
          />
          <DateStrip className="mt-4" value={scheduleDate} onChange={setScheduleDate} />
          <div className="mt-5">
            {availability.loading ? (
              <div className="flex justify-center py-10">
                <LoadingSpinner />
              </div>
            ) : availability.error ? (
              <ErrorState error={availability.error} onRetry={availability.refetch} compact />
            ) : (
              <TimeSlotPicker
                slots={availability.data ?? []}
                value=""
                onChange={() => undefined}
                emptyMessage={`${record.name} is not working on ${formatDate(scheduleDate, 'EEEE d MMMM')}.`}
              />
            )}
          </div>
        </Card>
      )}

      {/* Services */}
      {tab === 'services' && (
        <Card padded={false}>
          <div className="p-5 pb-3">
            <CardHeader title="Services offered" description={`${offered.length} services`} />
          </div>
          {offered.length === 0 ? (
            <div className="p-5 pt-0">
              <EmptyState icon={Scissors} title="No services assigned" compact />
            </div>
          ) : (
            <ul className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
              {offered.map((service) => (
                <li key={service.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl surface-muted text-ink-400">
                    <Scissors className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {service.name}
                    </p>
                    <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">
                      {formatDuration(service.duration)}
                    </p>
                  </div>
                  <span className="font-display text-lg font-bold text-ink-900 dark:text-white">
                    {formatMoney(service.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        <div className="grid gap-4 sm:grid-cols-2">
          {record.reviews.length === 0 ? (
            <EmptyState
              icon={Quote}
              title="No reviews yet"
              description="Customer feedback appears here once reviews start coming in."
              className="sm:col-span-2"
            />
          ) : (
            record.reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900 dark:text-white">
                      {review.customerName}
                    </p>
                    <p className="text-[13px] text-ink-500 dark:text-ink-400">{formatDate(review.date)}</p>
                  </div>
                  <Rating value={review.rating} showValue={false} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  “{review.comment}”
                </p>
              </Card>
            ))
          )}
        </div>
      )}

      <BarberFormModal
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={() => {
          barber.refetch();
          stats.refetch();
        }}
        barber={record}
        locations={locations.data ?? []}
        services={services.data ?? []}
      />
    </>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl surface-muted p-3">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </span>
      <p className="mt-1 font-display text-lg font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}

function BigMetric({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-200/70 p-4 dark:border-white/[0.07]">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        {icon}
        {label}
      </span>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900 dark:text-white">
        {loading ? '—' : value}
      </p>
    </div>
  );
}
