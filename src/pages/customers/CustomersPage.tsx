import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Plus, Repeat, Search, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { CustomerStatusBadge } from '@/components/common/Badge';
import { SearchInput } from '@/components/common/SearchInput';
import { Select } from '@/components/common/Field';
import { SkeletonTable } from '@/components/common/Loading';
import { EmptyState, ErrorState } from '@/components/common/States';
import { Pagination } from '@/components/common/Pagination';
import { Menu } from '@/components/common/Menu';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { barberRepository, customerRepository, locationRepository } from '@/services';
import { CUSTOMER_STATUS_META } from '@/constants/domain';
import { DEFAULT_PAGE_SIZE } from '@/constants/config';
import { formatRelativeDay } from '@/utils/datetime';
import type { ApiError, Customer, CustomerStatus } from '@/types';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const { formatMoney } = useSettings();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const debouncedSearch = useDebounce(search, 350);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === 'all' ? undefined : status,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    }),
    [debouncedSearch, status, page],
  );

  const list = useAsyncData(() => customerRepository.getCustomers(params), [params]);
  const stats = useAsyncData(() => customerRepository.getCustomerStats(), []);
  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const barbers = useAsyncData(() => barberRepository.getBarbers(), []);

  const remove = useAsyncAction(customerRepository.deleteCustomer.bind(customerRepository));

  const canManage = can('customers.manage');
  const isFiltered = Boolean(debouncedSearch) || status !== 'all';

  const refreshAll = () => {
    list.refetch();
    stats.refetch();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await remove.run(deleting.id);
      toast.success('Customer removed.', { description: `${deleting.name} is no longer on your list.` });
      setDeleting(null);
      refreshAll();
    } catch (caught) {
      toast.error('Could not remove the customer', { description: (caught as ApiError).message });
    }
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description="Your client list, visit history and spending at a glance."
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
              New Customer
            </Button>
          )
        }
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Total Customers"
          value={stats.data?.total ?? 0}
          icon={Users}
          accent="gold"
          loading={stats.loading}
        />
        <StatCard
          label="New This Month"
          value={stats.data?.newThisMonth ?? 0}
          icon={UserPlus}
          accent="blue"
          loading={stats.loading}
        />
        <StatCard
          label="Returning"
          value={stats.data?.returning ?? 0}
          icon={Repeat}
          caption="5+ visits"
          accent="green"
          loading={stats.loading}
        />
        <StatCard
          label="VIP Customers"
          value={stats.data?.vip ?? 0}
          icon={Crown}
          accent="violet"
          loading={stats.loading}
        />
      </section>

      <div className="mb-4 mt-5 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search name, phone or email…"
          className="min-w-0 flex-1 sm:max-w-sm"
        />
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CustomerStatus | 'all');
            setPage(1);
          }}
          containerClassName="w-auto min-w-[10rem]"
        >
          <option value="all">All customers</option>
          {(Object.keys(CUSTOMER_STATUS_META) as CustomerStatus[]).map((value) => (
            <option key={value} value={value}>
              {CUSTOMER_STATUS_META[value].label}
            </option>
          ))}
        </Select>
      </div>

      {list.loading && !list.data && <SkeletonTable rows={8} columns={6} />}

      {list.error && !list.loading && (
        <ErrorState
          error={list.error}
          title="Unable to load customers."
          onRetry={list.refetch}
          className="surface-card border-solid"
        />
      )}

      {!list.error && list.data && (
        <Card padded={false} className="overflow-hidden">
          {list.data.items.length === 0 ? (
            <EmptyState
              icon={isFiltered ? Search : Users}
              title="No customers found"
              description={
                isFiltered
                  ? "No customers match your search or filter."
                  : 'Your client list is empty. Add your first customer to get started.'
              }
              className="border-0"
              action={
                isFiltered ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatus('all');
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
                      Add Customer
                    </Button>
                  )
                )
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[820px] text-left">
                  <thead>
                    <tr className="border-b border-ink-200/70 dark:border-white/[0.07]">
                      {['Customer', 'Phone', 'Visits', 'Last Visit', 'Total Spent', 'Status', ''].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-400"
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
                    {list.data.items.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => navigate(`/customers/${customer.id}`)}
                        className="cursor-pointer transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={customer.name} src={customer.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                                {customer.name}
                              </p>
                              <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">
                                {customer.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
                          {customer.phone}
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums text-ink-700 dark:text-ink-200">
                          {customer.totalVisits}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-700 dark:text-ink-200">
                          {customer.lastVisit ? formatRelativeDay(customer.lastVisit) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-ink-900 dark:text-white">
                          {formatMoney(customer.totalSpent)}
                        </td>
                        <td className="px-4 py-3">
                          <CustomerStatusBadge status={customer.status} size="sm" />
                        </td>
                        <td className="px-2 py-3" onClick={(event) => event.stopPropagation()}>
                          <Menu
                            buttonLabel={`Actions for ${customer.name}`}
                            items={[
                              { label: 'View profile', onClick: () => navigate(`/customers/${customer.id}`) },
                              {
                                label: 'Edit',
                                onClick: () => {
                                  setEditing(customer);
                                  setFormOpen(true);
                                },
                                disabled: !canManage,
                              },
                              {
                                label: 'Book appointment',
                                onClick: () => navigate('/appointments/new'),
                                disabled: !can('appointments.manage'),
                              },
                              {
                                label: 'Delete',
                                onClick: () => setDeleting(customer),
                                destructive: true,
                                separated: true,
                                disabled: !canManage,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y divide-ink-200/70 md:hidden dark:divide-white/[0.07]">
                {list.data.items.map((customer) => (
                  <li key={customer.id} className="flex items-center gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <Avatar name={customer.name} src={customer.avatarUrl} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                            {customer.name}
                          </p>
                          <span className="shrink-0 text-sm font-semibold text-ink-900 dark:text-white">
                            {formatMoney(customer.totalSpent)}
                          </span>
                        </div>
                        <p className="truncate text-[13px] text-ink-500 dark:text-ink-400">
                          {customer.phone}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <CustomerStatusBadge status={customer.status} size="sm" />
                          <span className="text-[11px] text-ink-400">{customer.totalVisits} visits</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>

              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                total={list.data.total}
                pageSize={list.data.pageSize}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      )}

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refreshAll}
        customer={editing}
        locations={locations.data ?? []}
        barbers={barbers.data ?? []}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        loading={remove.loading}
        title="Remove this customer?"
        confirmLabel="Remove customer"
        message={
          <>
            <strong>{deleting?.name}</strong> will be removed from your client list and any upcoming
            bookings will be cancelled. Past appointments stay in your reports.
          </>
        }
      />
    </>
  );
}
