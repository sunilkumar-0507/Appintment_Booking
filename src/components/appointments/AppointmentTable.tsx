import { useNavigate } from 'react-router-dom';
import { CalendarClock, CheckCircle2, Eye, Pencil, Trash2, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AppointmentDetail, ID } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { AppointmentStatusBadge } from '@/components/common/Badge';
import { Menu } from '@/components/common/Menu';
import type { MenuItem } from '@/components/common/Menu';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { formatDuration } from '@/utils/datetime';

export interface AppointmentTableProps {
  appointments: AppointmentDetail[];
  onView: (appointment: AppointmentDetail) => void;
  onEdit: (appointment: AppointmentDetail) => void;
  onReschedule: (appointment: AppointmentDetail) => void;
  onCancel: (appointment: AppointmentDetail) => void;
  onComplete: (appointment: AppointmentDetail) => void;
  onDelete: (appointment: AppointmentDetail) => void;
  pendingId?: ID | null;
}

/**
 * Responsive appointment list: a real table from `md` up, stacked cards below.
 * Both layouts render from the same row model so the two never drift.
 */
export function AppointmentTable({
  appointments,
  onView,
  onEdit,
  onReschedule,
  onCancel,
  onComplete,
  onDelete,
  pendingId,
}: AppointmentTableProps) {
  const { formatMoney, formatDate, formatTime } = useSettings();
  const { can } = useAuth();
  const navigate = useNavigate();

  const canManage = can('appointments.manage');

  const buildMenu = (appointment: AppointmentDetail): MenuItem[] => {
    const closed = appointment.status === 'cancelled' || appointment.status === 'completed';

    return [
      { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: () => onView(appointment) },
      {
        label: 'Edit',
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => onEdit(appointment),
        disabled: !canManage,
      },
      {
        label: 'Reschedule',
        icon: <CalendarClock className="h-4 w-4" />,
        onClick: () => onReschedule(appointment),
        disabled: !canManage || appointment.status === 'cancelled',
      },
      {
        label: 'Mark Completed',
        icon: <CheckCircle2 className="h-4 w-4" />,
        onClick: () => onComplete(appointment),
        disabled: !canManage || closed,
      },
      {
        label: 'Cancel',
        icon: <XCircle className="h-4 w-4" />,
        onClick: () => onCancel(appointment),
        destructive: true,
        separated: true,
        disabled: !canManage || appointment.status === 'cancelled',
      },
      {
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => onDelete(appointment),
        destructive: true,
        disabled: !canManage,
      },
    ];
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-ink-200/70 dark:border-white/[0.07]">
              {['Customer', 'Service', 'Barber', 'Date', 'Time', 'Status', 'Price', ''].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400',
                    heading === 'Price' && 'text-right',
                  )}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
            {appointments.map((appointment) => (
              <tr
                key={appointment.id}
                onClick={() => navigate(`/appointments/${appointment.id}`)}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.03]',
                  pendingId === appointment.id && 'pointer-events-none opacity-50',
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={appointment.customerName}
                      src={appointment.customerAvatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {appointment.customerName}
                      </p>
                      <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">
                        {appointment.reference}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="text-sm text-ink-800 dark:text-ink-100">{appointment.serviceName}</p>
                  <p className="text-[13px] text-ink-500 dark:text-ink-400">
                    {formatDuration(appointment.serviceDuration)}
                  </p>
                </td>

                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: appointment.barberColor }}
                      aria-hidden
                    />
                    <span className="text-sm text-ink-800 dark:text-ink-100">{appointment.barberName}</span>
                  </span>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-800 dark:text-ink-100">
                  {formatDate(appointment.date)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-sm tabular-nums text-ink-800 dark:text-ink-100">
                  {formatTime(appointment.startTime)}
                </td>

                <td className="px-4 py-3">
                  <AppointmentStatusBadge status={appointment.status} size="sm" />
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold text-ink-900 dark:text-white">
                  {formatMoney(appointment.price)}
                </td>

                <td className="px-2 py-3" onClick={(event) => event.stopPropagation()}>
                  <Menu items={buildMenu(appointment)} buttonLabel={`Actions for ${appointment.customerName}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-ink-200/70 md:hidden dark:divide-white/[0.07]">
        {appointments.map((appointment) => (
          <li
            key={appointment.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3.5 transition-colors active:bg-ink-50 dark:active:bg-white/[0.03]',
              pendingId === appointment.id && 'pointer-events-none opacity-50',
            )}
          >
            <button
              type="button"
              onClick={() => navigate(`/appointments/${appointment.id}`)}
              className="flex min-w-0 flex-1 items-start gap-3 text-left"
            >
              <Avatar name={appointment.customerName} src={appointment.customerAvatarUrl} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                    {appointment.customerName}
                  </p>
                  <span className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
                    {formatMoney(appointment.price)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[13px] text-ink-500 dark:text-ink-400">
                  {appointment.serviceName} · {appointment.barberName}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[13px] tabular-nums text-ink-600 dark:text-ink-300">
                    {formatDate(appointment.date)} · {formatTime(appointment.startTime)}
                  </span>
                  <AppointmentStatusBadge status={appointment.status} size="sm" withDot={false} />
                </div>
              </div>
            </button>
            <Menu items={buildMenu(appointment)} buttonLabel={`Actions for ${appointment.customerName}`} />
          </li>
        ))}
      </ul>
    </>
  );
}
