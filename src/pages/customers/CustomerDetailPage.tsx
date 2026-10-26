import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CalendarDays,
  CalendarPlus,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Scissors,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { AppointmentStatusBadge, CustomerStatusBadge } from '@/components/common/Badge';
import { PageLoader, SkeletonCard } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { barberRepository, customerRepository, locationRepository, serviceRepository } from '@/services';
import { formatDate, formatRelativeDay } from '@/utils/datetime';

export default function CustomerDetailPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { formatMoney, formatTime } = useSettings();
  const [editing, setEditing] = useState(false);

  const customer = useAsyncData(() => customerRepository.getCustomer(id), [id]);
  const history = useAsyncData(() => customerRepository.getCustomerAppointments(id), [id]);
  const services = useAsyncData(() => serviceRepository.getServices(), []);
  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);

  if (customer.loading && !customer.data) return <PageLoader message="Loading customer…" />;

  if (customer.error || !customer.data) {
    return (
      <>
        <PageHeader title="Customer" backTo={{ to: '/customers', label: 'Customers' }} />
        <ErrorState
          error={customer.error}
          title="Unable to load this customer."
          onRetry={customer.refetch}
          className="surface-card border-solid"
        />
      </>
    );
  }

  const record = customer.data;
  const favouriteServices = record.favoriteServiceIds
    .map((serviceId) => services.data?.find((service) => service.id === serviceId))
    .filter(Boolean);
  const preferredBarber = barbers.data?.find((barber) => barber.id === record.preferredBarberId);
  const homeBranch = locations.data?.find((location) => location.id === record.locationId);

  const upcoming = (history.data ?? []).filter(
    (appointment) => appointment.status === 'confirmed' || appointment.status === 'pending',
  );
  const past = (history.data ?? []).filter(
    (appointment) => appointment.status !== 'confirmed' && appointment.status !== 'pending',
  );

  return (
    <>
      <PageHeader
        title={record.name}
        description={`Customer since ${formatDate(record.joinedAt.slice(0, 10), 'MMMM yyyy')}`}
        backTo={{ to: '/customers', label: 'Customers' }}
        actions={
          <>
            {can('customers.manage') && (
              <Button variant="outline" onClick={() => setEditing(true)} leftIcon={<Pencil className="h-4 w-4" />}>
                Edit
              </Button>
            )}
            {can('appointments.manage') && (
              <Link to="/appointments/new">
                <Button variant="accent" leftIcon={<CalendarPlus className="h-4 w-4" />}>
                  Book Appointment
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile rail */}
        <aside className="space-y-5">
          <Card>
            <div className="flex flex-col items-center text-center">
              <Avatar name={record.name} src={record.avatarUrl} size="xl" />
              <h2 className="mt-3 font-display text-lg font-bold text-ink-900 dark:text-white">
                {record.name}
              </h2>
              <div className="mt-2">
                <CustomerStatusBadge status={record.status} />
              </div>
            </div>

            <div className="mt-5 space-y-2.5 border-t border-ink-200/70 pt-5 dark:border-white/[0.07]">
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
              {homeBranch && (
                <p className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                  {homeBranch.name}
                </p>
              )}
              <p className="flex items-center gap-2.5 text-sm text-ink-600 dark:text-ink-300">
                <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                Joined {formatDate(record.joinedAt.slice(0, 10))}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Spending" />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Metric
                icon={<Wallet className="h-4 w-4" />}
                label="Total spent"
                value={formatMoney(record.totalSpent)}
              />
              <Metric
                icon={<TrendingUp className="h-4 w-4" />}
                label="Total visits"
                value={String(record.totalVisits)}
              />
              <Metric
                icon={<Scissors className="h-4 w-4" />}
                label="Avg. per visit"
                value={formatMoney(
                  record.totalVisits > 0 ? Math.round(record.totalSpent / record.totalVisits) : 0,
                )}
              />
              <Metric
                icon={<CalendarDays className="h-4 w-4" />}
                label="Last visit"
                value={record.lastVisit ? formatRelativeDay(record.lastVisit) : 'Never'}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Preferences" />
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  Favourite services
                </p>
                {favouriteServices.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {favouriteServices.map((service) => (
                      <li
                        key={service!.id}
                        className="rounded-full bg-ink-100 px-2.5 py-1 text-[13px] font-medium text-ink-700 dark:bg-white/[0.08] dark:text-ink-200"
                      >
                        {service!.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">No history yet.</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                  Preferred barber
                </p>
                {preferredBarber ? (
                  <Link
                    to={`/barbers/${preferredBarber.id}`}
                    className="mt-2 flex items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.04]"
                  >
                    <Avatar
                      name={preferredBarber.name}
                      src={preferredBarber.avatarUrl}
                      size="sm"
                      ringColor={preferredBarber.color}
                    />
                    <span className="text-sm font-medium text-ink-900 dark:text-white">
                      {preferredBarber.name}
                    </span>
                  </Link>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">No preference set.</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                  {record.notes || 'No notes on file.'}
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* History */}
        <div className="space-y-5 lg:col-span-2">
          {upcoming.length > 0 && (
            <Card padded={false}>
              <div className="p-5 pb-3">
                <CardHeader title="Upcoming appointments" description={`${upcoming.length} booked`} />
              </div>
              <ul className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
                {upcoming.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    id={appointment.id}
                    title={appointment.serviceName}
                    subtitle={`${appointment.barberName} · ${appointment.locationName}`}
                    date={`${formatRelativeDay(appointment.date)} at ${formatTime(appointment.startTime)}`}
                    price={formatMoney(appointment.price)}
                    badge={<AppointmentStatusBadge status={appointment.status} size="sm" />}
                  />
                ))}
              </ul>
            </Card>
          )}

          <Card padded={false}>
            <div className="p-5 pb-3">
              <CardHeader
                title="Appointment history"
                description={`${past.length} past appointment${past.length === 1 ? '' : 's'}`}
              />
            </div>

            {history.loading && (
              <div className="space-y-3 p-5 pt-0">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} lines={1} />
                ))}
              </div>
            )}

            {history.error && (
              <div className="p-5 pt-0">
                <ErrorState error={history.error} onRetry={history.refetch} compact />
              </div>
            )}

            {!history.loading && !history.error && past.length === 0 && (
              <div className="p-5 pt-0">
                <EmptyState
                  icon={CalendarDays}
                  title="No past appointments"
                  description="Once this customer has been in, their visit history appears here."
                  compact
                />
              </div>
            )}

            {past.length > 0 && (
              <ul className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
                {past.slice(0, 25).map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    id={appointment.id}
                    title={appointment.serviceName}
                    subtitle={`${appointment.barberName} · ${appointment.locationName}`}
                    date={`${formatDate(appointment.date)} at ${formatTime(appointment.startTime)}`}
                    price={formatMoney(appointment.price)}
                    badge={<AppointmentStatusBadge status={appointment.status} size="sm" />}
                  />
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <CustomerFormModal
        open={editing}
        onClose={() => setEditing(false)}
        onSaved={customer.refetch}
        customer={record}
        locations={locations.data ?? []}
        barbers={barbers.data ?? []}
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
      <p className="mt-1.5 font-display text-lg font-bold text-ink-900 dark:text-white">{value}</p>
    </div>
  );
}

function AppointmentRow({
  id,
  title,
  subtitle,
  date,
  price,
  badge,
}: {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  price: string;
  badge: React.ReactNode;
}) {
  return (
    <li>
      <Link
        to={`/appointments/${id}`}
        className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.03]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl surface-muted text-ink-400">
          <Scissors className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">{title}</span>
          <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">{subtitle}</span>
        </span>
        <span className="hidden shrink-0 text-right sm:block">
          <span className="block text-[13px] text-ink-600 dark:text-ink-300">{date}</span>
          <span className="block text-sm font-semibold text-ink-900 dark:text-white">{price}</span>
        </span>
        <span className="shrink-0">{badge}</span>
      </Link>
    </li>
  );
}
