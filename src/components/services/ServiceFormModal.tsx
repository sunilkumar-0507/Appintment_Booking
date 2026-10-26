import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Checkbox, Input, Select, Switch, Textarea } from '@/components/common/Field';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { useSettings } from '@/context/SettingsContext';
import { serviceRepository } from '@/services';
import { SERVICE_CATEGORY_OPTIONS } from '@/constants/domain';
import { currencySymbol } from '@/utils/currency';
import type { ApiError, Barber, Service, ServiceCategory } from '@/types';

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Enter a service name.'),
  description: z.string().trim().min(5, 'Add a short description customers will see.'),
  duration: z.coerce
    .number()
    .min(5, 'Services must run for at least 5 minutes.')
    .max(480, 'That is longer than a working day.'),
  price: z.coerce.number().min(0, 'Price cannot be negative.').max(10000, 'That price looks wrong.'),
  category: z.string().min(1, 'Choose a category.'),
  barberIds: z.array(z.string()).min(1, 'Assign at least one barber.'),
  active: z.boolean(),
});

type ServiceValues = z.infer<typeof serviceSchema>;

export interface ServiceFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service?: Service | null;
  barbers: Barber[];
}

export function ServiceFormModal({ open, onClose, onSaved, service, barbers }: ServiceFormModalProps) {
  const toast = useToast();
  const { currency } = useSettings();
  const isEdit = Boolean(service);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<ServiceValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { barberIds: [], active: true },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: service?.name ?? '',
      description: service?.description ?? '',
      duration: service?.duration ?? 30,
      price: service?.price ?? 25,
      category: service?.category ?? 'hair',
      barberIds: service?.barberIds ?? [],
      active: service?.active ?? true,
    });
  }, [open, service, reset]);

  const save = useAsyncAction(async (values: ServiceValues) => {
    const payload = { ...values, category: values.category as ServiceCategory };
    return service
      ? serviceRepository.updateService(service.id, payload)
      : serviceRepository.createService(payload);
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.run(values);
      toast.success(isEdit ? 'Service updated.' : 'Service created.', {
        description: `${values.name} has been saved to your menu.`,
      });
      onSaved();
      onClose();
    } catch (caught) {
      const error = caught as ApiError;
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field in serviceSchema.shape) setError(field as keyof ServiceValues, { message });
      });
      toast.error('Could not save the service', { description: error.message });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit service' : 'Add a service'}
      description={
        isEdit ? 'Update pricing, duration and who can perform it.' : 'Add a new service to your menu.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEdit ? 'Save changes' : 'Add service'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <Input label="Service name" required error={errors.name?.message} {...register('name')} />

        <Textarea
          label="Description"
          required
          rows={2}
          placeholder="What the customer gets — shown on the booking page."
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid gap-3.5 sm:grid-cols-3">
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            step={5}
            required
            error={errors.duration?.message}
            {...register('duration')}
          />
          <Input
            label={`Price (${currency})`}
            type="number"
            min={0}
            step="0.01"
            required
            leftIcon={<span className="text-sm font-medium">{currencySymbol(currency)}</span>}
            error={errors.price?.message}
            {...register('price')}
          />
          <Select label="Category" required error={errors.category?.message} {...register('category')}>
            {SERVICE_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-700 dark:text-ink-200">
            Available barbers <span className="text-danger-500">*</span>
          </legend>
          <div className="grid gap-2 rounded-xl border border-ink-200 p-3 sm:grid-cols-2 dark:border-white/10">
            {barbers.map((barber) => (
              <Checkbox key={barber.id} value={barber.id} label={barber.name} {...register('barberIds')} />
            ))}
          </div>
          {errors.barberIds && (
            <p className="mt-1.5 text-[13px] text-danger-600">{errors.barberIds.message}</p>
          )}
        </fieldset>

        <div className="rounded-xl border border-ink-200 p-3.5 dark:border-white/10">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch
                id="service-active"
                checked={field.value}
                onChange={field.onChange}
                label="Bookable"
                description="Disabled services stay in your reports but disappear from booking flows."
              />
            )}
          />
        </div>
      </form>
    </Modal>
  );
}
