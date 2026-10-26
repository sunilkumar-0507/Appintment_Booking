import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Phone, Save } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input, Select, Textarea } from '@/components/common/Field';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { customerRepository } from '@/services';
import type { ApiError, Barber, Customer, Location } from '@/types';

const customerSchema = z.object({
  firstName: z.string().trim().min(2, 'Enter a first name.'),
  lastName: z.string().trim().min(1, 'Enter a last name.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z
    .string()
    .trim()
    .min(6, 'Enter a contactable phone number.')
    .regex(/^[+\d][\d\s()-]{5,}$/, 'Enter a valid phone number.'),
  locationId: z.string().min(1, 'Choose a home branch.'),
  preferredBarberId: z.string().optional(),
  notes: z.string().max(500, 'Keep notes under 500 characters.').optional(),
});

type CustomerValues = z.infer<typeof customerSchema>;

export interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Present when editing; omitted when creating. */
  customer?: Customer | null;
  locations: Location[];
  barbers: Barber[];
}

export function CustomerFormModal({
  open,
  onClose,
  onSaved,
  customer,
  locations,
  barbers,
}: CustomerFormModalProps) {
  const toast = useToast();
  const isEdit = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
  });

  // Reload the form whenever a different customer is opened.
  useEffect(() => {
    if (!open) return;
    reset({
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
      email: customer?.email ?? '',
      phone: customer?.phone ?? '',
      locationId: customer?.locationId ?? locations[0]?.id ?? '',
      preferredBarberId: customer?.preferredBarberId ?? '',
      notes: customer?.notes ?? '',
    });
  }, [open, customer, locations, reset]);

  const save = useAsyncAction(async (values: CustomerValues) => {
    const payload = { ...values, preferredBarberId: values.preferredBarberId || undefined };
    return customer
      ? customerRepository.updateCustomer(customer.id, payload)
      : customerRepository.createCustomer(payload);
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.run(values);
      toast.success(isEdit ? 'Customer updated.' : 'New customer registered.', {
        description: `${values.firstName} ${values.lastName} has been saved.`,
      });
      onSaved();
      onClose();
    } catch (caught) {
      const error = caught as ApiError;
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field in customerSchema.shape) setError(field as keyof CustomerValues, { message });
      });
      toast.error('Could not save the customer', { description: error.message });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit customer' : 'New customer'}
      description={
        isEdit ? 'Update contact details, branch and preferences.' : 'Add someone to your client list.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEdit ? 'Save changes' : 'Add customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input label="First name" required error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Last name" required error={errors.lastName?.message} {...register('lastName')} />
        </div>

        <Input
          label="Email"
          type="email"
          required
          leftIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Phone"
          type="tel"
          required
          leftIcon={<Phone className="h-4 w-4" />}
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Select label="Home branch" required error={errors.locationId?.message} {...register('locationId')}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </Select>

          <Select label="Preferred barber" {...register('preferredBarberId')}>
            <option value="">No preference</option>
            {barbers.map((barber) => (
              <option key={barber.id} value={barber.id}>
                {barber.name}
              </option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Notes"
          rows={3}
          placeholder="Preferred style, allergies, anything the barber should remember…"
          error={errors.notes?.message}
          {...register('notes')}
        />
      </form>
    </Modal>
  );
}
