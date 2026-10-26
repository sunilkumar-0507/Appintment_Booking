import { useMemo, useState } from 'react';
import { Clock, Pencil, Plus, Power, Scissors, Search, Trash2, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Menu } from '@/components/common/Menu';
import { SearchInput } from '@/components/common/SearchInput';
import { SkeletonCard } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CategoryPill } from '@/components/booking/SelectionCards';
import { ServiceFormModal } from '@/components/services/ServiceFormModal';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { barberRepository, serviceRepository } from '@/services';
import { SERVICE_CATEGORY_LABELS } from '@/constants/domain';
import { formatDuration } from '@/utils/datetime';
import { cn } from '@/utils/cn';
import { matchesQuery } from '@/utils/helpers';
import type { ApiError, Service, ServiceCategory } from '@/types';

export default function ServicesPage() {
  const { can } = useAuth();
  const { formatMoney } = useSettings();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ServiceCategory | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const services = useAsyncData(() => serviceRepository.getServices(), []);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);

  const remove = useAsyncAction(serviceRepository.deleteService.bind(serviceRepository));
  const update = useAsyncAction(serviceRepository.updateService.bind(serviceRepository));

  const canManage = can('services.manage');

  const visible = useMemo(
    () =>
      (services.data ?? []).filter((service) => {
        if (category !== 'all' && service.category !== category) return false;
        return matchesQuery(`${service.name} ${service.description}`, debouncedSearch);
      }),
    [services.data, category, debouncedSearch],
  );

  const categories = useMemo(() => {
    const present = new Set((services.data ?? []).map((service) => service.category));
    return ['all', ...Object.keys(SERVICE_CATEGORY_LABELS).filter((key) => present.has(key as ServiceCategory))];
  }, [services.data]);

  const barberNames = useMemo(
    () => new Map((barbers.data ?? []).map((barber) => [barber.id, barber.name])),
    [barbers.data],
  );

  const isFiltered = Boolean(debouncedSearch) || category !== 'all';

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove.run(deleting.id);
      toast.success('Service deleted.', { description: `${deleting.name} has been removed from your menu.` });
      setDeleting(null);
      services.refetch();
    } catch (caught) {
      toast.error('Could not delete the service', { description: (caught as ApiError).message });
    }
  };

  const handleToggle = async (service: Service) => {
    try {
      await update.run(service.id, { active: !service.active });
      toast.success(service.active ? 'Service disabled.' : 'Service enabled.', {
        description: service.active
          ? `${service.name} is hidden from booking flows.`
          : `${service.name} is bookable again.`,
      });
      services.refetch();
    } catch (caught) {
      toast.error('Could not update the service', { description: (caught as ApiError).message });
    }
  };

  return (
    <>
      <PageHeader
        title="Services"
        description="Your menu — what you offer, how long it takes and what it costs."
        actions={
          canManage && (
            <Button
              variant="accent"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              Add Service
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search services…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
      </div>

      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {categories.map((key) => (
          <CategoryPill
            key={key}
            category={key}
            active={category === key}
            onClick={() => setCategory(key as ServiceCategory | 'all')}
          />
        ))}
      </div>

      {services.loading && !services.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={3} />
          ))}
        </div>
      )}

      {services.error && (
        <ErrorState
          error={services.error}
          title="Unable to load services."
          onRetry={services.refetch}
          className="surface-card border-solid"
        />
      )}

      {!services.error && services.data && visible.length === 0 && (
        <EmptyState
          icon={isFiltered ? Search : Scissors}
          title="No services found"
          description={
            isFiltered
              ? 'No services match your search or category filter.'
              : 'Your menu is empty. Add your first service to start taking bookings.'
          }
          className="surface-card border-solid"
          action={
            isFiltered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategory('all');
                }}
              >
                Clear filters
              </Button>
            ) : (
              canManage && (
                <Button
                  variant="accent"
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  Add Service
                </Button>
              )
            )
          }
        />
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((service) => (
            <Card key={service.id} className={cn('flex flex-col', !service.active && 'opacity-70')}>
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-gold-400 dark:bg-white/[0.08]">
                  <Scissors className="h-4 w-4" aria-hidden />
                </span>

                <div className="flex items-center gap-1.5">
                  {!service.active && <Badge size="sm">Disabled</Badge>}
                  {canManage && (
                    <Menu
                      buttonLabel={`Actions for ${service.name}`}
                      items={[
                        {
                          label: 'Edit',
                          icon: <Pencil className="h-4 w-4" />,
                          onClick: () => {
                            setEditing(service);
                            setFormOpen(true);
                          },
                        },
                        {
                          label: service.active ? 'Disable' : 'Enable',
                          icon: <Power className="h-4 w-4" />,
                          onClick: () => handleToggle(service),
                        },
                        {
                          label: 'Delete',
                          icon: <Trash2 className="h-4 w-4" />,
                          onClick: () => setDeleting(service),
                          destructive: true,
                          separated: true,
                        },
                      ]}
                    />
                  )}
                </div>
              </div>

              <h3 className="mt-3 font-semibold text-ink-900 dark:text-white">{service.name}</h3>
              <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                {service.description}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 dark:text-ink-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {formatDuration(service.duration)}
                </span>
                <span className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                  {formatMoney(service.price)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink-200/70 pt-3.5 dark:border-white/[0.07]">
                <span
                  className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 dark:text-ink-400"
                  title={service.barberIds.map((barberId) => barberNames.get(barberId)).filter(Boolean).join(', ')}
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  {service.barberIds.length} barber{service.barberIds.length === 1 ? '' : 's'}
                </span>
                <span className="text-[13px] text-ink-500 dark:text-ink-400">
                  <span className="font-semibold text-ink-700 dark:text-ink-200">{service.bookingCount}</span>{' '}
                  bookings
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ServiceFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={services.refetch}
        service={editing}
        barbers={barbers.data ?? []}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={remove.loading}
        title="Delete this service?"
        confirmLabel="Delete service"
        message={
          <>
            <strong>{deleting?.name}</strong> will be removed from your menu. If it has upcoming bookings,
            disable it instead so past appointments keep their pricing.
          </>
        }
      />
    </>
  );
}
