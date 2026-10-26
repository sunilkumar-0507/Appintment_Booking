import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Scissors,
  XCircle,
} from 'lucide-react';
import { Drawer } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { AppointmentStatusBadge } from '@/components/common/Badge';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { formatDuration, formatLongDate } from '@/utils/datetime';
import type { AppointmentDetail } from '@/types';

export interface AppointmentDrawerProps {
  appointment: AppointmentDetail | null;
  open: boolean;
  onClose: () => void;
  onComplete: (appointment: AppointmentDetail) => void;
  onCancel: (appointment: AppointmentDetail) => void;
  onReschedule: (appointment: AppointmentDetail) => void;
  loading?: boolean;
}

/** Side panel opened by clicking any calendar block. */
export function AppointmentDrawer({
  appointment,
  open,
  onClose,
  onComplete,
  onCancel,
  onReschedule,
  loading,
}: AppointmentDrawerProps) {
  const { formatMoney, formatTime } = useSettings();
  const { can } = useAuth();

  if (!appointment) return null;

  const canManage = can('appointments.manage');
  const isClosed = appointment.status === 'cancelled' || appointment.status === 'completed';

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={appointment.customerName}
      description={`${appointment.reference} · ${appointment.serviceName}`}
      footer={
        canManage && (
          <div className="flex flex-wrap gap-2">
            {!isClosed && (
              <>
                <Button
                  size="sm"
                  variant="accent"
                  loading={loading}
                  onClick={() => onComplete(appointment)}
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                >
                  Complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onReschedule(appointment)}
                  leftIcon={<CalendarClock className="h-3.5 w-3.5" />}
                >
                  Reschedule
                </Button>
              </>
            )}
            {appointment.status !== 'cancelled' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(appointment)}
                leftIcon={<XCircle className="h-3.5 w-3.5" />}
                className="text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10"
              >
                Cancel
              </Button>
            )}
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <AppointmentStatusBadge status={appointment.status} />
          <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">
            {formatMoney(appointment.price)}
          </span>
        </div>

        <div className="space-y-3 rounded-xl border border-ink-200/70 p-4 dark:border-white/[0.07]">
          <Row
            icon={<CalendarClock className="h-4 w-4" />}
            label="When"
            value={`${formatLongDate(appointment.date)}`}
          />
          <Row
            icon={<Clock className="h-4 w-4" />}
            label="Time"
            value={`${formatTime(appointment.startTime)} – ${formatTime(appointment.endTime)} (${formatDuration(appointment.serviceDuration)})`}
          />
          <Row icon={<Scissors className="h-4 w-4" />} label="Service" value={appointment.serviceName} />
          <Row icon={<MapPin className="h-4 w-4" />} label="Branch" value={appointment.locationName} />
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Barber</p>
          <Link
            to={`/barbers/${appointment.barberId}`}
            className="flex items-center gap-3 rounded-xl border border-ink-200/70 p-3 transition-colors hover:bg-ink-50 dark:border-white/[0.07] dark:hover:bg-white/[0.04]"
          >
            <Avatar
              name={appointment.barberName}
              src={appointment.barberAvatarUrl}
              size="md"
              ringColor={appointment.barberColor}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900 dark:text-white">
              {appointment.barberName}
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          </Link>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Customer</p>
          <Link
            to={`/customers/${appointment.customerId}`}
            className="flex items-center gap-3 rounded-xl border border-ink-200/70 p-3 transition-colors hover:bg-ink-50 dark:border-white/[0.07] dark:hover:bg-white/[0.04]"
          >
            <Avatar name={appointment.customerName} src={appointment.customerAvatarUrl} size="md" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink-900 dark:text-white">
                {appointment.customerName}
              </span>
              <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">
                {appointment.customerPhone}
              </span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-ink-400" aria-hidden />
          </Link>

          <div className="mt-2 flex gap-2">
            <a href={`tel:${appointment.customerPhone}`} className="flex-1">
              <Button variant="outline" size="sm" fullWidth leftIcon={<Phone className="h-3.5 w-3.5" />}>
                Call
              </Button>
            </a>
            <a href={`mailto:${appointment.customerEmail}`} className="flex-1">
              <Button variant="outline" size="sm" fullWidth leftIcon={<Mail className="h-3.5 w-3.5" />}>
                Email
              </Button>
            </a>
          </div>
        </div>

        {appointment.notes && (
          <div className="rounded-xl surface-muted p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Notes</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              {appointment.notes}
            </p>
          </div>
        )}

        <Link to={`/appointments/${appointment.id}`}>
          <Button variant="outline" fullWidth rightIcon={<ExternalLink className="h-3.5 w-3.5" />}>
            Open full appointment
          </Button>
        </Link>
      </div>
    </Drawer>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-ink-400" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </span>
        <span className="block text-sm font-medium text-ink-900 dark:text-white">{value}</span>
      </span>
    </div>
  );
}
