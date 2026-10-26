import { CalendarDays, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Field';
import { APPOINTMENT_STATUS_OPTIONS } from '@/constants/domain';
import type { AppointmentFilters, Barber, Service } from '@/types';
import { useDisclosure } from '@/hooks/useDisclosure';
import { cn } from '@/utils/cn';

export interface AppointmentFiltersBarProps {
  filters: AppointmentFilters;
  onChange: (patch: Partial<AppointmentFilters>) => void;
  onReset: () => void;
  barbers: Barber[];
  services: Service[];
  /** Number of filters currently narrowing the list, excluding search. */
  activeCount: number;
}

export function AppointmentFiltersBar({
  filters,
  onChange,
  onReset,
  barbers,
  services,
  activeCount,
}: AppointmentFiltersBarProps) {
  // On mobile the filter row is collapsed behind a toggle to save vertical space.
  const panel = useDisclosure(false);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={filters.search ?? ''}
          onChange={(search) => onChange({ search, page: 1 })}
          placeholder="Search customer or appointment…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />

        <Button
          variant="outline"
          onClick={panel.toggle}
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          className="sm:hidden"
        >
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-ink-950">
              {activeCount}
            </span>
          )}
        </Button>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<X className="h-3.5 w-3.5" />}
            className="hidden sm:inline-flex"
          >
            Clear filters
          </Button>
        )}
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5',
          panel.isOpen ? 'grid' : 'hidden sm:grid',
        )}
      >
        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) =>
              onChange({ dateFrom: event.target.value || undefined, page: 1 })
            }
            aria-label="From date"
            className="h-10 w-full rounded-xl border border-ink-200 bg-[rgb(var(--surface-card))] pl-9 pr-3 text-sm text-ink-900 outline-none transition-colors hover:border-ink-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
          />
        </div>

        <div className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-400"
            aria-hidden
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => onChange({ dateTo: event.target.value || undefined, page: 1 })}
            aria-label="To date"
            className="h-10 w-full rounded-xl border border-ink-200 bg-[rgb(var(--surface-card))] pl-9 pr-3 text-sm text-ink-900 outline-none transition-colors hover:border-ink-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
          />
        </div>

        <Select
          aria-label="Filter by barber"
          value={filters.barberId ?? ''}
          onChange={(event) => onChange({ barberId: event.target.value || undefined, page: 1 })}
        >
          <option value="">All barbers</option>
          {barbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by service"
          value={filters.serviceId ?? ''}
          onChange={(event) => onChange({ serviceId: event.target.value || undefined, page: 1 })}
        >
          <option value="">All services</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by status"
          value={filters.status ?? 'all'}
          onChange={(event) =>
            onChange({ status: event.target.value as AppointmentFilters['status'], page: 1 })
          }
        >
          {APPOINTMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="sm:hidden">
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  );
}
