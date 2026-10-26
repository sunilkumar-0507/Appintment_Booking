import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, UserRound } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/common/Button';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Field';
import { SkeletonCard } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BarberCard } from '@/components/barbers/BarberCard';
import { BarberFormModal } from '@/components/barbers/BarberFormModal';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { barberRepository, locationRepository, serviceRepository } from '@/services';
import { matchesQuery } from '@/utils/helpers';
import type { ApiError, Barber } from '@/types';

export default function BarbersPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [locationId, setLocationId] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [toggling, setToggling] = useState<Barber | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const barbers = useAsyncData(
    () => barberRepository.getBarbers({ locationId: locationId === 'all' ? undefined : locationId }),
    [locationId],
  );
  const stats = useAsyncData(() => barberRepository.getAllBarberStats(), []);
  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const services = useAsyncData(() => serviceRepository.getServices(), []);

  const update = useAsyncAction(barberRepository.updateBarber.bind(barberRepository));

  const canManage = can('barbers.manage');
  const statsById = useMemo(
    () => new Map((stats.data ?? []).map((entry) => [entry.barberId, entry])),
    [stats.data],
  );

  // Search runs client-side: the roster is small and it keeps typing instant.
  const visible = useMemo(
    () =>
      (barbers.data ?? []).filter((barber) =>
        matchesQuery(`${barber.name} ${barber.specialization} ${barber.email}`, debouncedSearch),
      ),
    [barbers.data, debouncedSearch],
  );

  const isFiltered = Boolean(debouncedSearch) || locationId !== 'all';

  const handleToggle = async () => {
    if (!toggling) return;
    const nextStatus = toggling.status === 'disabled' ? 'available' : 'disabled';
    try {
      await update.run(toggling.id, { status: nextStatus });
      toast.success(nextStatus === 'disabled' ? 'Barber disabled.' : 'Barber re-enabled.', {
        description: `${toggling.name} ${nextStatus === 'disabled' ? 'will not appear in booking flows.' : 'is bookable again.'}`,
      });
      setToggling(null);
      barbers.refetch();
    } catch (caught) {
      toast.error('Could not update the barber', { description: (caught as ApiError).message });
    }
  };

  return (
    <>
      <PageHeader
        title="Barbers"
        description="Your team, their chairs and how today is going."
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
              Add Barber
            </Button>
          )
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search barbers…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Select
          aria-label="Filter by branch"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
          containerClassName="w-auto min-w-[12rem]"
        >
          <option value="all">All branches</option>
          {locations.data?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </Select>
      </div>

      {barbers.loading && !barbers.data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} lines={4} />
          ))}
        </div>
      )}

      {barbers.error && (
        <ErrorState
          error={barbers.error}
          title="Unable to load barbers."
          onRetry={barbers.refetch}
          className="surface-card border-solid"
        />
      )}

      {!barbers.error && barbers.data && visible.length === 0 && (
        <EmptyState
          icon={isFiltered ? Search : UserRound}
          title="No barbers found"
          description={
            isFiltered
              ? 'No barbers match your search or branch filter.'
              : 'Add your first barber to start taking bookings.'
          }
          className="surface-card border-solid"
          action={
            isFiltered ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setLocationId('all');
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
                  Add Barber
                </Button>
              )
            )
          }
        />
      )}

      {visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((barber) => (
            <BarberCard
              key={barber.id}
              barber={barber}
              stats={statsById.get(barber.id)}
              statsLoading={stats.loading}
              canManage={canManage}
              onEdit={(entry) => {
                setEditing(entry);
                setFormOpen(true);
              }}
              onSchedule={(entry) => navigate(`/barbers/${entry.id}`)}
              onToggleActive={setToggling}
            />
          ))}
        </div>
      )}

      <BarberFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          barbers.refetch();
          stats.refetch();
        }}
        barber={editing}
        locations={locations.data ?? []}
        services={services.data ?? []}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        onClose={() => setToggling(null)}
        onConfirm={handleToggle}
        loading={update.loading}
        confirmVariant={toggling?.status === 'disabled' ? 'primary' : 'danger'}
        title={toggling?.status === 'disabled' ? 'Re-enable this barber?' : 'Disable this barber?'}
        confirmLabel={toggling?.status === 'disabled' ? 'Enable barber' : 'Disable barber'}
        message={
          toggling?.status === 'disabled' ? (
            <>
              <strong>{toggling?.name}</strong> will appear in booking flows again and can take new
              appointments.
            </>
          ) : (
            <>
              <strong>{toggling?.name}</strong> will be hidden from booking flows. Existing appointments are
              not affected.
            </>
          )
        }
      />
    </>
  );
}
