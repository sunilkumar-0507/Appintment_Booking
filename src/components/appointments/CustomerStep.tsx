import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Mail, Phone, UserPlus, Users } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { Input, Select } from '@/components/common/Field';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSpinner } from '@/components/common/Loading';
import { CustomerStatusBadge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/States';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/context/ToastContext';
import { customerRepository } from '@/services';
import type { ApiError, Customer, Location } from '@/types';

const newCustomerSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter a first name.'),
  lastName: z.string().trim().min(1, 'Enter a last name.'),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a contactable phone number.')
    .regex(/^[+\d][\d\s()-]{5,}$/, 'Enter a valid phone number.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  locationId: z.string().min(1, 'Choose a branch.'),
});

type NewCustomerValues = z.infer<typeof newCustomerSchema>;

export interface CustomerStepProps {
  selected: Customer | null;
  onSelect: (customer: Customer) => void;
  locations: Location[];
}

/** Step 1 of the booking wizard: pick an existing client or register a new one. */
export function CustomerStep({ selected, onSelect, locations }: CustomerStepProps) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const toast = useToast();

  const customers = useAsyncData(
    () => customerRepository.getCustomers({ search: debounced, pageSize: 8 }),
    [debounced],
    { enabled: mode === 'existing' },
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewCustomerValues>({
    resolver: zodResolver(newCustomerSchema),
    defaultValues: { locationId: locations[0]?.id ?? '' },
  });

  const create = useAsyncAction(customerRepository.createCustomer.bind(customerRepository));

  const onCreate = handleSubmit(async (values) => {
    try {
      const customer = await create.run(values);
      if (customer) {
        toast.success('New customer registered.', { description: `${customer.name} has been added.` });
        onSelect(customer);
        setMode('existing');
      }
    } catch (caught) {
      const error = caught as ApiError;
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field in newCustomerSchema.shape) {
          setError(field as keyof NewCustomerValues, { message });
        }
      });
      toast.error('Could not add the customer', { description: error.message });
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <ModeButton
          active={mode === 'existing'}
          icon={<Users className="h-4 w-4" />}
          label="Existing customer"
          onClick={() => setMode('existing')}
        />
        <ModeButton
          active={mode === 'new'}
          icon={<UserPlus className="h-4 w-4" />}
          label="New customer"
          onClick={() => setMode('new')}
        />
      </div>

      {mode === 'existing' ? (
        <div className="space-y-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, phone or email…"
          />

          {customers.loading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {!customers.loading && customers.data?.items.length === 0 && (
            <EmptyState
              icon={Users}
              title="No customers found"
              description="Nobody matches that search. Register them as a new customer instead."
              compact
              action={
                <Button variant="outline" size="sm" onClick={() => setMode('new')}>
                  Add new customer
                </Button>
              }
            />
          )}

          {!customers.loading && customers.data && customers.data.items.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {customers.data.items.map((customer) => {
                const isSelected = selected?.id === customer.id;
                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(customer)}
                      aria-pressed={isSelected}
                      className={cn(
                        'relative flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-200',
                        'bg-[rgb(var(--surface-card))]',
                        isSelected
                          ? 'border-gold-400 bg-gold-50/60 ring-2 ring-gold-400/25 dark:border-gold-400 dark:bg-gold-400/[0.07]'
                          : 'border-ink-200 hover:border-ink-300 hover:shadow-card dark:border-white/10 dark:hover:border-white/20',
                      )}
                    >
                      {isSelected && (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400 text-ink-950">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                        </span>
                      )}
                      <Avatar name={customer.name} src={customer.avatarUrl} size="md" />
                      <span className="min-w-0 flex-1 pr-5">
                        <span className="block truncate font-semibold text-ink-900 dark:text-white">
                          {customer.name}
                        </span>
                        <span className="block truncate text-[13px] text-ink-500 dark:text-ink-400">
                          {customer.phone}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <CustomerStatusBadge status={customer.status} size="sm" />
                          <span className="text-[11px] text-ink-400">{customer.totalVisits} visits</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <form onSubmit={onCreate} className="space-y-3.5" noValidate>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label="First name" required error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" required error={errors.lastName?.message} {...register('lastName')} />
          </div>

          <Input
            label="Phone"
            required
            type="tel"
            placeholder="+44 7700 900000"
            leftIcon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Email"
            required
            type="email"
            placeholder="name@example.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Select label="Home branch" required error={errors.locationId?.message} {...register('locationId')}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} — {location.city}
              </option>
            ))}
          </Select>

          <Button type="submit" loading={create.loading} leftIcon={<UserPlus className="h-4 w-4" />}>
            Add customer &amp; continue
          </Button>
        </form>
      )}
    </div>
  );
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-150',
        active
          ? 'border-ink-900 bg-ink-900 text-white dark:border-white/20 dark:bg-white/[0.12] dark:text-white'
          : 'border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-900 dark:border-white/10 dark:text-ink-300 dark:hover:border-white/20',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
