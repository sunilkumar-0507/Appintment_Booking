import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { LoadingSpinner } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DayView, MonthView, WeekView } from '@/components/calendar/CalendarViews';
import { AppointmentDrawer } from '@/components/calendar/AppointmentDrawer';
import { RescheduleDialog } from '@/components/appointments/RescheduleDialog';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useAuth } from '@/context/AuthContext';
import { appointmentRepository, barberRepository } from '@/services';
import { cn } from '@/utils/cn';
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  toISODate,
} from '@/utils/datetime';
import type { AppointmentDetail } from '@/types';

type CalendarView = 'day' | 'week' | 'month';

const VIEW_OPTIONS = [
  { value: 'day' as const, label: 'Day' },
  { value: 'week' as const, label: 'Week' },
  { value: 'month' as const, label: 'Month' },
];

export default function CalendarPage() {
  const { can, user } = useAuth();
  const [view, setView] = useState<CalendarView>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [barberId, setBarberId] = useState<string>(
    user?.role === 'barber' ? user.barberId ?? 'all' : 'all',
  );

  const [selected, setSelected] = useState<AppointmentDetail | null>(null);
  const [rescheduling, setRescheduling] = useState<AppointmentDetail | null>(null);
  const [cancelling, setCancelling] = useState<AppointmentDetail | null>(null);

  // The fetch window follows the active view so we never over-fetch.
  const range = useMemo(() => {
    if (view === 'day') return { from: toISODate(anchor), to: toISODate(anchor) };
    if (view === 'week') {
      return {
        from: toISODate(startOfWeek(anchor, { weekStartsOn: 1 })),
        to: toISODate(endOfWeek(anchor, { weekStartsOn: 1 })),
      };
    }
    return {
      from: toISODate(startOfWeek(startOfMonth(anchor), { weekStartsOn: 1 })),
      to: toISODate(endOfWeek(endOfMonth(anchor), { weekStartsOn: 1 })),
    };
  }, [view, anchor]);

  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);

  const appointments = useAsyncData(
    () =>
      appointmentRepository.getAppointmentsInRange(range.from, range.to, {
        barberId: barberId === 'all' ? undefined : barberId,
      }),
    [range.from, range.to, barberId],
  );

  const actions = useAppointmentActions(() => {
    appointments.refetch();
    setSelected(null);
  });

  const shift = (direction: 1 | -1) => {
    if (view === 'day') setAnchor((current) => addDays(current, direction));
    else if (view === 'week') setAnchor((current) => addDays(current, direction * 7));
    else setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const periodLabel =
    view === 'day'
      ? format(anchor, 'EEEE, d MMMM yyyy')
      : view === 'week'
        ? `${format(startOfWeek(anchor, { weekStartsOn: 1 }), 'd MMM')} – ${format(endOfWeek(anchor, { weekStartsOn: 1 }), 'd MMM yyyy')}`
        : format(anchor, 'MMMM yyyy');

  const ViewComponent = view === 'day' ? DayView : view === 'week' ? WeekView : MonthView;

  const isBarberLocked = user?.role === 'barber';

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Every chair, every booking — day, week or month."
        actions={
          can('appointments.manage') && (
            <Link to="/appointments/new">
              <Button variant="accent" leftIcon={<Plus className="h-4 w-4" />}>
                New Appointment
              </Button>
            </Link>
          )
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous period"
            className="rounded-lg border border-ink-200 bg-[rgb(var(--surface-card))] p-2 text-ink-600 transition-colors hover:bg-ink-50 dark:border-white/10 dark:text-ink-300 dark:hover:bg-white/[0.06]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next period"
            className="rounded-lg border border-ink-200 bg-[rgb(var(--surface-card))] p-2 text-ink-600 transition-colors hover:bg-ink-50 dark:border-white/10 dark:text-ink-300 dark:hover:bg-white/[0.06]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <Button
            variant="outline"
            size="sm"
            className="ml-1"
            onClick={() => setAnchor(new Date())}
            leftIcon={<CalendarDays className="h-3.5 w-3.5" />}
          >
            Today
          </Button>
        </div>

        <p className="font-display text-base font-semibold text-ink-900 dark:text-white">{periodLabel}</p>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {appointments.loading && <LoadingSpinner size="sm" />}
          <SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} aria-label="Calendar view" />
        </div>
      </div>

      {/* Barber filter rail */}
      {!isBarberLocked && (
        <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
          <FilterChip label="All Barbers" active={barberId === 'all'} onClick={() => setBarberId('all')} />
          {barbers.data?.map((barber) => (
            <FilterChip
              key={barber.id}
              label={barber.name}
              color={barber.color}
              active={barberId === barber.id}
              onClick={() => setBarberId(barber.id)}
            />
          ))}
        </div>
      )}

      <Card padded={false} className="overflow-hidden">
        {appointments.error ? (
          <ErrorState
            error={appointments.error}
            title="Unable to load the calendar."
            onRetry={appointments.refetch}
            className="border-0"
          />
        ) : (
          <div className={appointments.loading && !appointments.data ? 'opacity-50' : ''}>
            <ViewComponent
              date={anchor}
              appointments={appointments.data ?? []}
              onSelect={setSelected}
              onSelectDate={(date) => {
                setAnchor(date);
                setView('day');
              }}
            />
          </div>
        )}
      </Card>

      <AppointmentDrawer
        appointment={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        loading={Boolean(selected) && actions.isPending(selected!.id)}
        onComplete={(appointment) => actions.complete(appointment.id)}
        onCancel={setCancelling}
        onReschedule={(appointment) => {
          setSelected(null);
          setRescheduling(appointment);
        }}
      />

      <RescheduleDialog
        appointment={rescheduling}
        open={Boolean(rescheduling)}
        onClose={() => setRescheduling(null)}
        loading={Boolean(rescheduling) && actions.isPending(rescheduling!.id)}
        onConfirm={async (payload) => {
          const result = await actions.reschedule(rescheduling!.id, payload);
          if (result) setRescheduling(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        loading={Boolean(cancelling) && actions.isPending(cancelling!.id)}
        onConfirm={async () => {
          await actions.cancel(cancelling!.id);
          setCancelling(null);
        }}
        title="Cancel this appointment?"
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        message={
          <>
            <strong>{cancelling?.customerName}</strong>&apos;s booking will be marked as cancelled and the
            slot released for rebooking.
          </>
        }
      />
    </>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-ink-900 bg-ink-900 text-white dark:border-white/20 dark:bg-white/[0.12] dark:text-white'
          : 'border-ink-200 bg-[rgb(var(--surface-card))] text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-white/10 dark:text-ink-300 dark:hover:border-white/20',
      )}
    >
      {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {label}
    </button>
  );
}
