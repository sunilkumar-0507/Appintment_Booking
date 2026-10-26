import { Check, Clock, MapPin, Scissors } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Barber, Location, Service } from '@/types';
import { Avatar } from '@/components/common/Avatar';
import { Rating } from '@/components/common/Rating';
import { BarberStatusBadge } from '@/components/common/Badge';
import { useSettings } from '@/context/SettingsContext';
import { formatDuration } from '@/utils/datetime';
import { SERVICE_CATEGORY_LABELS } from '@/constants/domain';

const SELECTED_RING =
  'border-gold-400 ring-2 ring-gold-400/25 bg-gold-50/60 dark:bg-gold-400/[0.07] dark:border-gold-400';
const IDLE_RING =
  'border-ink-200 hover:border-ink-300 hover:shadow-card dark:border-white/10 dark:hover:border-white/20';

function SelectedTick() {
  return (
    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-ink-950 animate-scale-in">
      <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Service                                                                     */
/* -------------------------------------------------------------------------- */

export function ServiceCard({
  service,
  selected,
  onSelect,
}: {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}) {
  const { formatMoney } = useSettings();

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200',
        'bg-[rgb(var(--surface-card))]',
        selected ? SELECTED_RING : IDLE_RING,
      )}
    >
      {selected && <SelectedTick />}

      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-gold-400 dark:bg-white/[0.08]">
        <Scissors className="h-4 w-4" aria-hidden />
      </span>

      <span className="mt-1 block pr-6 font-semibold text-ink-900 dark:text-white">{service.name}</span>
      <span className="block text-[13px] leading-relaxed text-ink-500 line-clamp-2 dark:text-ink-400">
        {service.description}
      </span>

      <span className="mt-1 flex w-full items-center justify-between">
        <span className="inline-flex items-center gap-1 text-[13px] text-ink-500 dark:text-ink-400">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          {formatDuration(service.duration)}
        </span>
        <span className="font-display text-lg font-bold text-ink-900 dark:text-white">
          {formatMoney(service.price)}
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Barber                                                                      */
/* -------------------------------------------------------------------------- */

export function BarberSelectCard({
  barber,
  selected,
  onSelect,
  showStatus = true,
}: {
  barber: Barber;
  selected: boolean;
  onSelect: () => void;
  showStatus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-all duration-200',
        'bg-[rgb(var(--surface-card))]',
        selected ? SELECTED_RING : IDLE_RING,
      )}
    >
      {selected && <SelectedTick />}

      <Avatar name={barber.name} src={barber.avatarUrl} size="lg" ringColor={barber.color} />

      <span className="min-w-0 flex-1 pr-6">
        <span className="block truncate font-semibold text-ink-900 dark:text-white">{barber.name}</span>
        <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">
          {barber.specialization}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-2">
          <Rating value={barber.rating} reviewCount={barber.reviewCount} />
          {showStatus && <BarberStatusBadge status={barber.status} size="sm" />}
        </span>
      </span>
    </button>
  );
}

/** "No preference" option — lets the customer take the first free chair. */
export function AnyBarberCard({ selected, onSelect }: { selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full items-center gap-3.5 rounded-2xl border border-dashed p-4 text-left transition-all duration-200',
        'bg-[rgb(var(--surface-card))]',
        selected ? SELECTED_RING : IDLE_RING,
      )}
    >
      {selected && <SelectedTick />}
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full surface-muted text-ink-400">
        <Scissors className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 pr-6">
        <span className="block font-semibold text-ink-900 dark:text-white">Any available barber</span>
        <span className="block text-[13px] text-ink-500 dark:text-ink-400">
          We'll match you with the first free chair
        </span>
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Location                                                                    */
/* -------------------------------------------------------------------------- */

export function LocationCard({
  location,
  barberCount,
  selected,
  onSelect,
}: {
  location: Location;
  barberCount?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200',
        'bg-[rgb(var(--surface-card))]',
        selected ? SELECTED_RING : IDLE_RING,
      )}
    >
      {selected && <SelectedTick />}

      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-gold-400 dark:bg-white/[0.08]">
        <MapPin className="h-5 w-5" aria-hidden />
      </span>

      <span className="min-w-0 flex-1 pr-6">
        <span className="block truncate font-semibold text-ink-900 dark:text-white">{location.name}</span>
        <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">
          {location.addressLine1}, {location.city}
        </span>
        {typeof barberCount === 'number' && (
          <span className="mt-1 block text-[13px] text-ink-400 dark:text-ink-500">
            {barberCount} barber{barberCount === 1 ? '' : 's'}
          </span>
        )}
      </span>
    </button>
  );
}

/** Small pill listing a service category — used above the service grid. */
export function CategoryPill({
  category,
  active,
  onClick,
}: {
  category: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-ink-900 bg-ink-900 text-white dark:border-gold-400 dark:bg-gold-400 dark:text-ink-950'
          : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-white/10 dark:text-ink-300 dark:hover:border-white/20',
      )}
    >
      {category === 'all' ? 'All' : SERVICE_CATEGORY_LABELS[category as keyof typeof SERVICE_CATEGORY_LABELS] ?? category}
    </button>
  );
}
