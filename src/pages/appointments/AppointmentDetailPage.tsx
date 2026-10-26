import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Save,
  Scissors,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { AppointmentStatusBadge } from '@/components/common/Badge';
import { Select, Textarea } from '@/components/common/Field';
import { PageLoader } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RescheduleDialog } from '@/components/appointments/RescheduleDialog';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useAppointmentActions } from '@/hooks/useAppointmentActions';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { appointmentRepository } from '@/services';
import { APPOINTMENT_STATUS_META } from '@/constants/domain';
import { formatDuration, formatLongDate, formatTimeAgo } from '@/utils/datetime';
import type { ApiError, AppointmentStatus } from '@/types';

export default function AppointmentDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = useAuth();
  const { formatMoney, formatTime } = useSettings();
  const toast = useToast();

  const detail = useAsyncData(() => appointmentRepository.getAppointment(id), [id]);
  const actions = useAppointmentActions(detail.refetch);

  const [editing, setEditing] = useState(searchParams.get('edit') === '1');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<AppointmentStatus>('confirmed');
  const [rescheduling, setRescheduling] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Seed the edit form once the record arrives.
  useEffect(() => {
    if (detail.data) {
      setNotes(detail.data.notes ?? '');
      setStatus(detail.data.status);
    }
  }, [detail.data]);

  const save = useAsyncAction(appointmentRepository.updateAppointment.bind(appointmentRepository));

  if (detail.loading && !detail.data) return <PageLoader message="Loading appointment…" />;

  if (detail.error || !detail.data) {
    return (
      <>
        <PageHeader title="Appointment" backTo={{ to: '/appointments', label: 'Appointments' }} />
        <ErrorState
          error={detail.error}
          title="Unable to load this appointment."
          onRetry={detail.refetch}
          className="surface-card border-solid"
        />
      </>
    );
  }

  const appointment = detail.data;
  const canManage = can('appointments.manage');
  const isClosed = appointment.status === 'cancelled' || appointment.status === 'completed';

  const handleSave = async () => {
    try {
      await save.run(appointment.id, { notes: notes.trim() || undefined, status });
      toast.success('Appointment updated.', { description: 'Your changes have been saved.' });
      setEditing(false);
      setSearchParams({});
      detail.refetch();
    } catch (caught) {
      toast.error('Could not save changes', { description: (caught as ApiError).message });
    }
  };

  return (
    <>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {appointment.customerName}
            <AppointmentStatusBadge status={appointment.status} />
          </span>
        }
        description={`${appointment.reference} · booked ${formatTimeAgo(appointment.createdAt)} via ${appointment.source}`}
        backTo={{ to: '/appointments', label: 'Appointments' }}
        actions={
          canManage && (
            <>
              {!isClosed && (
                <Button
                  variant="outline"
                  onClick={() => setRescheduling(true)}
                  leftIcon={<CalendarClock className="h-4 w-4" />}
                >
                  Reschedule
                </Button>
              )}
              {!isClosed && (
                <Button
                  variant="outline"
                  loading={actions.isPending(appointment.id)}
                  onClick={() => actions.complete(appointment.id)}
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Mark Completed
                </Button>
              )}
              {appointment.status !== 'cancelled' && (
                <Button
                  variant="danger"
                  onClick={() => setConfirmingCancel(true)}
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              )}
            </>
          )
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Appointment details"
              action={
                canManage &&
                (editing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditing(false);
                        setNotes(appointment.notes ?? '');
                        setStatus(appointment.status);
                        setSearchParams({});
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      loading={save.loading}
                      onClick={handleSave}
                      leftIcon={<Save className="h-3.5 w-3.5" />}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                ))
              }
            />

            <dl className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <DetailRow icon={Scissors} label="Service" value={appointment.serviceName} />
              <DetailRow
                icon={Clock}
                label="Duration"
                value={`${formatDuration(appointment.serviceDuration)} · ${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)}`}
              />
              <DetailRow icon={CalendarClock} label="Date" value={formatLongDate(appointment.date)} />
              <DetailRow
                icon={UserRound}
                label="Barber"
                value={
                  <Link
                    to={`/barbers/${appointment.barberId}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: appointment.barberColor }}
                      aria-hidden
                    />
                    {appointment.barberName}
                  </Link>
                }
              />
              <DetailRow icon={MapPin} label="Location" value={appointment.locationName} />
              <DetailRow
                icon={Scissors}
                label="Price"
                value={
                  <span className="font-display text-lg font-bold">{formatMoney(appointment.price)}</span>
                }
              />
            </dl>

            <div className="mt-6 border-t border-ink-200/70 pt-5 dark:border-white/[0.07]">
              {editing ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as AppointmentStatus)}
                  >
                    {(Object.keys(APPOINTMENT_STATUS_META) as AppointmentStatus[]).map((value) => (
                      <option key={value} value={value}>
                        {APPOINTMENT_STATUS_META[value].label}
                      </option>
                    ))}
                  </Select>
                  <Textarea
                    containerClassName="sm:col-span-2"
                    label="Notes"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Add a note for the barber…"
                  />
                </div>
              ) : (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Notes</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
                    {appointment.notes || 'No notes have been added to this appointment.'}
                  </p>
                </>
              )}
            </div>
          </Card>

          {canManage && (
            <Card>
              <CardHeader title="Danger zone" description="Removing a booking cannot be undone." />
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmingDelete(true)}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  className="text-danger-600 hover:border-danger-300 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10"
                >
                  Delete appointment
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Customer rail */}
        <aside className="space-y-5">
          <Card>
            <CardHeader title="Customer" />
            <Link
              to={`/customers/${appointment.customerId}`}
              className="mt-4 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.04]"
            >
              <Avatar name={appointment.customerName} src={appointment.customerAvatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900 dark:text-white">
                  {appointment.customerName}
                </p>
                <p className="text-[13px] text-ink-500 dark:text-ink-400">View full profile</p>
              </div>
            </Link>

            <div className="mt-4 space-y-2.5 border-t border-ink-200/70 pt-4 dark:border-white/[0.07]">
              <a
                href={`tel:${appointment.customerPhone}`}
                className="flex items-center gap-2.5 text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                {appointment.customerPhone}
              </a>
              <a
                href={`mailto:${appointment.customerEmail}`}
                className="flex items-center gap-2.5 text-sm text-ink-600 transition-colors hover:text-ink-900 dark:text-ink-300 dark:hover:text-white"
              >
                <Mail className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                <span className="truncate">{appointment.customerEmail}</span>
              </a>
            </div>
          </Card>

          <Card>
            <CardHeader title="Barber" />
            <Link
              to={`/barbers/${appointment.barberId}`}
              className="mt-4 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.04]"
            >
              <Avatar
                name={appointment.barberName}
                src={appointment.barberAvatarUrl}
                size="lg"
                ringColor={appointment.barberColor}
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900 dark:text-white">{appointment.barberName}</p>
                <p className="text-[13px] text-ink-500 dark:text-ink-400">{appointment.locationName}</p>
              </div>
            </Link>
          </Card>
        </aside>
      </div>

      <RescheduleDialog
        appointment={appointment}
        open={rescheduling}
        onClose={() => setRescheduling(false)}
        loading={actions.isPending(appointment.id)}
        onConfirm={async (payload) => {
          const result = await actions.reschedule(appointment.id, payload);
          if (result) setRescheduling(false);
        }}
      />

      <ConfirmDialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        loading={actions.isPending(appointment.id)}
        onConfirm={async () => {
          await actions.cancel(appointment.id);
          setConfirmingCancel(false);
        }}
        title="Cancel this appointment?"
        confirmLabel="Cancel appointment"
        cancelLabel="Keep it"
        message={
          <>
            <strong>{appointment.customerName}</strong>&apos;s {appointment.serviceName} on{' '}
            {formatLongDate(appointment.date)} will be marked as cancelled and the slot released.
          </>
        }
      />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        loading={actions.isPending(appointment.id)}
        onConfirm={async () => {
          await actions.remove(appointment.id);
          setConfirmingDelete(false);
          navigate('/appointments');
        }}
        title="Delete this appointment?"
        confirmLabel="Delete permanently"
        message="This removes the booking and its history entirely. Cancelling instead keeps the record for reporting."
      />
    </>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium text-ink-900 dark:text-white">{value}</dd>
      </div>
    </div>
  );
}
