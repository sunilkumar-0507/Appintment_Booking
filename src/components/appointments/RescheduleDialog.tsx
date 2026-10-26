import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Field';
import { LoadingSpinner } from '@/components/common/Loading';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useSettings } from '@/context/SettingsContext';
import { appointmentRepository, barberRepository } from '@/services';
import { addDays, formatDate, toISODate, todayISO } from '@/utils/datetime';
import type { AppointmentDetail, ID } from '@/types';

export interface RescheduleDialogProps {
  appointment: AppointmentDetail | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (payload: { date: string; startTime: string; barberId: ID }) => Promise<void> | void;
  loading?: boolean;
}

/** Date + slot picker shared by the table, the drawer and the detail page. */
export function RescheduleDialog({
  appointment,
  open,
  onClose,
  onConfirm,
  loading = false,
}: RescheduleDialogProps) {
  const { formatDate: formatDatePreference } = useSettings();
  const [date, setDate] = useState(() => appointment?.date ?? todayISO());
  const [barberId, setBarberId] = useState<ID>(() => appointment?.barberId ?? '');
  const [time, setTime] = useState<string>('');

  // Reset the working copy whenever a different appointment is opened.
  const [trackedId, setTrackedId] = useState<ID | null>(null);
  if (appointment && appointment.id !== trackedId) {
    setTrackedId(appointment.id);
    setDate(appointment.date < todayISO() ? todayISO() : appointment.date);
    setBarberId(appointment.barberId);
    setTime('');
  }

  const barbers = useAsyncData(
    () => barberRepository.getBarbers({ serviceId: appointment?.serviceId }),
    [appointment?.serviceId],
    { enabled: open && Boolean(appointment) },
  );

  const availability = useAsyncData(
    () =>
      appointmentRepository.getAvailability({
        barberId,
        serviceId: appointment!.serviceId,
        locationId: appointment!.locationId,
        date,
        excludeAppointmentId: appointment!.id,
      }),
    [barberId, date, appointment?.id, appointment?.serviceId],
    { enabled: open && Boolean(appointment) && Boolean(barberId) },
  );

  if (!appointment) return null;

  const minDate = todayISO();
  const maxDate = toISODate(addDays(new Date(), 90));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule appointment"
      description={`${appointment.customerName} · ${appointment.serviceName} (${formatDatePreference(appointment.date)})`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep current time
          </Button>
          <Button
            variant="accent"
            loading={loading}
            disabled={!time}
            leftIcon={<CalendarClock className="h-4 w-4" />}
            onClick={() => onConfirm({ date, startTime: time, barberId })}
          >
            Confirm new time
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="reschedule-date"
              className="mb-1.5 block text-[13px] font-medium text-ink-700 dark:text-ink-200"
            >
              New date
            </label>
            <input
              id="reschedule-date"
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(event) => {
                setDate(event.target.value);
                setTime('');
              }}
              className="h-10 w-full rounded-xl border border-ink-200 bg-[rgb(var(--surface-card))] px-3 text-sm text-ink-900 outline-none transition-colors hover:border-ink-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
            />
          </div>

          <Select
            label="Barber"
            value={barberId}
            onChange={(event) => {
              setBarberId(event.target.value);
              setTime('');
            }}
          >
            {barbers.loading && <option>Loading…</option>}
            {barbers.data?.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <p className="mb-2 text-[13px] font-medium text-ink-700 dark:text-ink-200">
            Available times on {formatDate(date, 'EEEE, d MMMM')}
          </p>
          {availability.loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <TimeSlotPicker
              slots={availability.data ?? []}
              value={time}
              onChange={setTime}
              emptyMessage="This barber is not working on the selected date."
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
