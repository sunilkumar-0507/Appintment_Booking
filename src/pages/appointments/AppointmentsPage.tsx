import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, CalendarRange, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { SkeletonTable } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { AppointmentFiltersBar } from '@/components/appointments/AppointmentFiltersBar';
import { AppointmentTable } from '@/components/appointments/AppointmentTable';
import { RescheduleDialog } from '@/components/appointments/RescheduleDialog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useAuth } from '@/context/AuthContext';
import { appointmentRepository, barberRepository, serviceRepository } from '@/services';
import { DEFAULT_PAGE_SIZE } from '@/constants/config';
import { todayISO } from '@/utils/datetime';
import type { AppointmentDetail, AppointmentFilters } from '@/types';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { can, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<AppointmentFilters>(() => ({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    status: 'all',
    sortBy: 'date',
    sortDir: 'desc',
    // A barber only ever sees their own book.
    barberId: user?.role === 'barber' ? user.barberId : searchParams.get('barberId') ?? undefined,
    dateFrom: searchParams.get('date') ?? undefined,
    dateTo: searchParams.get('date') ?? undefined,
  }));

  const [rescheduling, setRescheduling] = useState<AppointmentDetail | null>(null);
  const [confirming, setConfirming] = useState<{
    appointment: AppointmentDetail;
    action: 'cancel' | 'delete';
  } | null>(null);

  const debouncedSearch = useDebounce(filters.search ?? '', 350);

  const query = useMemo<AppointmentFilters>(
    () => ({ ...filters, search: debouncedSearch || undefined }),
    [filters, debouncedSearch],
  );

  const list = useAsyncData(() => appointmentRepository.getAppointments(query), [query]);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);
  const services = useAsyncData(() => serviceRepository.getServices(), []);

  const actions = useAppointmentActions(list.refetch);

  const patchFilters = useCallback((patch: Partial<AppointmentFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchParams({});
    setFilters((current) => ({
      page: 1,
      pageSize: current.pageSize,
      status: 'all',
      sortBy: 'date',
      sortDir: 'desc',
      barberId: user?.role === 'barber' ? user.barberId : undefined,
    }));
  }, [setSearchParams, user]);

  const showToday = useCallback(() => {
    const today = todayISO();
    patchFilters({ dateFrom: today, dateTo: today, page: 1, sortDir: 'asc' });
  }, [patchFilters]);

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    // A barber's own-book filter is enforced, not chosen, so it does not count.
    user?.role === 'barber' ? undefined : filters.barberId,
    filters.serviceId,
    filters.status && filters.status !== 'all' ? filters.status : undefined,
  ].filter(Boolean).length;

  const isFiltered = activeFilterCount > 0 || Boolean(debouncedSearch);

  const handleConfirmDialog = async () => {
    if (!confirming) return;
    const { appointment, action } = confirming;
    if (action === 'cancel') await actions.cancel(appointment.id);
    else await actions.remove(appointment.id);
    setConfirming(null);
  };

  const handleReschedule = async (payload: { date: string; startTime: string; barberId: string }) => {
    if (!rescheduling) return;
    const result = await actions.reschedule(rescheduling.id, payload);
    if (result) setRescheduling(null);
  };

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Every booking across your shop, in one place."
        actions={
          <>
            <Button variant="outline" onClick={showToday} leftIcon={<CalendarDays className="h-4 w-4" />}>
              Today
            </Button>
            <Link to="/calendar">
              <Button variant="outline" leftIcon={<CalendarRange className="h-4 w-4" />}>
                Calendar View
              </Button>
            </Link>
            {can('appointments.manage') && (
              <Link to="/appointments/new">
                <Button variant="accent" leftIcon={<Plus className="h-4 w-4" />}>
                  New Appointment
                </Button>
              </Link>
            )}
          </>
        }
      />

      <AppointmentFiltersBar
        filters={filters}
        onChange={patchFilters}
        onReset={resetFilters}
        barbers={user?.role === 'barber' ? [] : barbers.data ?? []}
        services={services.data ?? []}
        activeCount={activeFilterCount}
      />

      {list.loading && !list.data && <SkeletonTable rows={8} columns={6} />}

      {list.error && !list.loading && (
        <ErrorState
          error={list.error}
          title="Unable to load appointments."
          onRetry={list.refetch}
          className="surface-card border-solid"
        />
      )}

      {!list.error && list.data && (
        <Card padded={false} className="overflow-hidden">
          {list.data.items.length === 0 ? (
            <EmptyState
              icon={isFiltered ? Search : CalendarDays}
              title="No appointments found"
              description={
                isFiltered
                  ? "You don't have any appointments matching your filters."
                  : 'Your schedule is empty. Create the first booking to get started.'
              }
              className="border-0"
              action={
                isFiltered ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  can('appointments.manage') && (
                    <Link to="/appointments/new">
                      <Button variant="accent" leftIcon={<Plus className="h-4 w-4" />}>
                        Create Appointment
                      </Button>
                    </Link>
                  )
                )
              }
            />
          ) : (
            <>
              <div className={list.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <AppointmentTable
                  appointments={list.data.items}
                  pendingId={actions.pendingId}
                  onView={(appointment) => navigate(`/appointments/${appointment.id}`)}
                  onEdit={(appointment) => navigate(`/appointments/${appointment.id}?edit=1`)}
                  onReschedule={setRescheduling}
                  onComplete={(appointment) => actions.complete(appointment.id)}
                  onCancel={(appointment) => setConfirming({ appointment, action: 'cancel' })}
                  onDelete={(appointment) => setConfirming({ appointment, action: 'delete' })}
                />
              </div>

              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                total={list.data.total}
                pageSize={list.data.pageSize}
                onPageChange={(page) => patchFilters({ page })}
              />
            </>
          )}
        </Card>
      )}

      <RescheduleDialog
        appointment={rescheduling}
        open={Boolean(rescheduling)}
        onClose={() => setRescheduling(null)}
        onConfirm={handleReschedule}
        loading={Boolean(rescheduling) && actions.isPending(rescheduling!.id)}
      />

      <ConfirmDialog
        open={Boolean(confirming)}
        onClose={() => setConfirming(null)}
        onConfirm={handleConfirmDialog}
        loading={Boolean(confirming) && actions.isPending(confirming!.appointment.id)}
        title={confirming?.action === 'delete' ? 'Delete this appointment?' : 'Cancel this appointment?'}
        confirmLabel={confirming?.action === 'delete' ? 'Delete appointment' : 'Cancel appointment'}
        cancelLabel="Keep it"
        message={
          confirming?.action === 'delete' ? (
            <>
              <strong>{confirming.appointment.customerName}</strong>&apos;s booking will be removed
              permanently. This cannot be undone — cancelling instead keeps it in the history.
            </>
          ) : (
            <>
              <strong>{confirming?.appointment.customerName}</strong>&apos;s appointment will be marked as
              cancelled and the slot released for rebooking.
            </>
          )
        }
      />
    </>
  );
}
