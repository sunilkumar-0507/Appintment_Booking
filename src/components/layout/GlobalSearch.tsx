import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Search, UserRound, Users } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/Loading';
import { EmptyState } from '@/components/common/States';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useSettings } from '@/context/SettingsContext';
import { appointmentRepository, barberRepository, customerRepository } from '@/services';
import { cn } from '@/utils/cn';

export interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

/** Cross-entity quick search reachable from the topbar or the `/` shortcut. */
export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const navigate = useNavigate();
  const { formatDate, formatTime } = useSettings();

  const enabled = open && debounced.trim().length >= 2;

  const { data, loading } = useAsyncData(
    async () => {
      const [customers, appointments, barbers] = await Promise.all([
        customerRepository.getCustomers({ search: debounced, pageSize: 4 }),
        appointmentRepository.getAppointments({ search: debounced, pageSize: 4, sortDir: 'desc' }),
        barberRepository.getBarbers({ search: debounced }),
      ]);
      return { customers: customers.items, appointments: appointments.items, barbers: barbers.slice(0, 3) };
    },
    [debounced],
    { enabled },
  );

  const go = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  const hasResults =
    data && (data.customers.length > 0 || data.appointments.length > 0 || data.barbers.length > 0);

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="-m-5">
        <div className="flex items-center gap-3 border-b border-ink-200/70 px-5 py-4 dark:border-white/[0.07]">
          <Search className="h-5 w-5 shrink-0 text-ink-400" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers, appointments or barbers…"
            aria-label="Search"
            className="w-full bg-transparent text-[15px] text-ink-900 outline-none placeholder:text-ink-400 dark:text-white"
          />
          {loading && <LoadingSpinner size="sm" />}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!enabled && (
            <p className="px-3 py-8 text-center text-sm text-ink-500 dark:text-ink-400">
              Type at least two characters to search.
            </p>
          )}

          {enabled && !loading && !hasResults && (
            <EmptyState
              icon={Search}
              title="No matches found"
              description={`Nothing matched “${debounced}”. Try a different name, phone number or reference.`}
              compact
              className="m-2 border-0"
            />
          )}

          {data && data.customers.length > 0 && (
            <ResultGroup label="Customers" icon={Users}>
              {data.customers.map((customer) => (
                <ResultRow
                  key={customer.id}
                  onClick={() => go(`/customers/${customer.id}`)}
                  leading={<Avatar name={customer.name} src={customer.avatarUrl} size="sm" />}
                  title={customer.name}
                  subtitle={`${customer.phone} · ${customer.totalVisits} visits`}
                />
              ))}
            </ResultGroup>
          )}

          {data && data.appointments.length > 0 && (
            <ResultGroup label="Appointments" icon={CalendarDays}>
              {data.appointments.map((appointment) => (
                <ResultRow
                  key={appointment.id}
                  onClick={() => go(`/appointments/${appointment.id}`)}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg surface-muted text-[11px] font-semibold text-ink-600 dark:text-ink-300">
                      {appointment.reference.replace('BF-', '')}
                    </span>
                  }
                  title={`${appointment.customerName} · ${appointment.serviceName}`}
                  subtitle={`${formatDate(appointment.date)} at ${formatTime(appointment.startTime)} · ${appointment.barberName}`}
                />
              ))}
            </ResultGroup>
          )}

          {data && data.barbers.length > 0 && (
            <ResultGroup label="Barbers" icon={UserRound}>
              {data.barbers.map((barber) => (
                <ResultRow
                  key={barber.id}
                  onClick={() => go(`/barbers/${barber.id}`)}
                  leading={<Avatar name={barber.name} src={barber.avatarUrl} size="sm" />}
                  title={barber.name}
                  subtitle={barber.specialization}
                />
              ))}
            </ResultGroup>
          )}
        </div>
      </div>
    </Modal>
  );
}

function ResultGroup({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof Search;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-1">
      <p className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </section>
  );
}

function ResultRow({
  onClick,
  leading,
  title,
  subtitle,
}: {
  onClick: () => void;
  leading: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        'hover:bg-ink-100 dark:hover:bg-white/[0.06]',
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">{title}</span>
        <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">{subtitle}</span>
      </span>
    </button>
  );
}
