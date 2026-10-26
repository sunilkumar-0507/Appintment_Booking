import { useCallback, useState } from 'react';
import type { Appointment, AppointmentStatus, ID, RescheduleAppointmentRequest } from '@/types';
import { appointmentRepository, normaliseError } from '@/services';
import { useToast } from '@/context/ToastContext';

const STATUS_TOASTS: Record<AppointmentStatus, { title: string; description: string }> = {
  confirmed: { title: 'Appointment confirmed.', description: 'The customer has been notified.' },
  pending: { title: 'Appointment set to pending.', description: 'It is awaiting confirmation.' },
  completed: { title: 'Appointment marked as completed.', description: 'Revenue has been recorded.' },
  cancelled: { title: 'Appointment cancelled.', description: 'The slot is free to rebook.' },
  'no-show': { title: 'Marked as a no-show.', description: 'This is recorded on the customer profile.' },
};

/**
 * Every appointment mutation the UI can trigger, in one place. The table, the
 * detail drawer and the detail page all share these handlers so the toasts and
 * error copy stay identical wherever the action is invoked.
 */
export function useAppointmentActions(onChanged?: () => void) {
  const toast = useToast();
  const [pendingId, setPendingId] = useState<ID | null>(null);

  const run = useCallback(
    async <T>(id: ID, operation: () => Promise<T>, success: { title: string; description?: string }) => {
      setPendingId(id);
      try {
        const result = await operation();
        toast.success(success.title, { description: success.description });
        onChanged?.();
        return result;
      } catch (caught) {
        const error = normaliseError(caught);
        toast.error('That did not work', { description: error.message });
        return undefined;
      } finally {
        setPendingId(null);
      }
    },
    [toast, onChanged],
  );

  const setStatus = useCallback(
    (id: ID, status: AppointmentStatus): Promise<Appointment | undefined> =>
      run(id, () => appointmentRepository.updateStatus(id, status), STATUS_TOASTS[status]),
    [run],
  );

  const reschedule = useCallback(
    (id: ID, payload: RescheduleAppointmentRequest): Promise<Appointment | undefined> =>
      run(id, () => appointmentRepository.reschedule(id, payload), {
        title: 'Appointment rescheduled.',
        description: 'The customer has been sent the new time.',
      }),
    [run],
  );

  const remove = useCallback(
    (id: ID): Promise<void | undefined> =>
      run(id, () => appointmentRepository.deleteAppointment(id), {
        title: 'Appointment deleted.',
        description: 'It has been removed from the schedule.',
      }),
    [run],
  );

  return {
    pendingId,
    isPending: (id: ID) => pendingId === id,
    setStatus,
    cancel: (id: ID) => setStatus(id, 'cancelled'),
    complete: (id: ID) => setStatus(id, 'completed'),
    confirm: (id: ID) => setStatus(id, 'confirmed'),
    markNoShow: (id: ID) => setStatus(id, 'no-show'),
    reschedule,
    remove,
  };
}
