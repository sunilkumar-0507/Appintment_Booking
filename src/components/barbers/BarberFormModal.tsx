import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save } from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Checkbox, Input, Select, Textarea } from '@/components/common/Field';
import { useAsyncAction } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { barberRepository } from '@/services';
import type { ApiError, Barber, BarberStatus, Location, Service } from '@/types';
import { BARBER_STATUS_META } from '@/constants/domain';

const barberSchema = z.object({
  name: z.string().trim().min(2, 'Enter the barber’s full name.'),
  email: z.string().trim().min(1, 'Enter an email address.').email('Enter a valid email address.'),
  phone: z.string().trim().min(6, 'Enter a contactable phone number.'),
  specialization: z.string().trim().min(2, 'Describe their speciality, e.g. Senior Barber.'),
  bio: z.string().trim().max(600, 'Keep the bio under 600 characters.').optional(),
  experience: z.coerce.number().min(0, 'Experience cannot be negative.').max(60, 'That seems too high.'),
  chairNumber: z.coerce.number().min(1, 'Chair numbers start at 1.').max(50, 'That seems too high.'),
  locationId: z.string().min(1, 'Choose a branch.'),
  status: z.string().min(1, 'Choose a status.'),
  serviceIds: z.array(z.string()).min(1, 'Select at least one service.'),
});

type BarberValues = z.infer<typeof barberSchema>;

export interface BarberFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  barber?: Barber | null;
  locations: Location[];
  services: Service[];
}

export function BarberFormModal({
  open,
  onClose,
  onSaved,
  barber,
  locations,
  services,
}: BarberFormModalProps) {
  const toast = useToast();
  const isEdit = Boolean(barber);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BarberValues>({
    resolver: zodResolver(barberSchema),
    defaultValues: { serviceIds: [] },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: barber?.name ?? '',
      email: barber?.email ?? '',
      phone: barber?.phone ?? '',
      specialization: barber?.specialization ?? '',
      bio: barber?.bio ?? '',
      experience: barber?.experience ?? 1,
      chairNumber: barber?.chairNumber ?? 1,
      locationId: barber?.locationId ?? locations[0]?.id ?? '',
      status: barber?.status ?? 'available',
      serviceIds: barber?.serviceIds ?? [],
    });
  }, [open, barber, locations, reset]);

  const save = useAsyncAction(async (values: BarberValues) => {
    const payload = {
      ...values,
      bio: values.bio ?? '',
      status: values.status as BarberStatus,
    };
    return barber ? barberRepository.updateBarber(barber.id, payload) : barberRepository.createBarber(payload);
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await save.run(values);
      toast.success(isEdit ? 'Barber updated.' : 'Barber added.', {
        description: `${values.name} has been saved to your team.`,
      });
      onSaved();
      onClose();
    } catch (caught) {
      const error = caught as ApiError;
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field in barberSchema.shape) setError(field as keyof BarberValues, { message });
      });
      toast.error('Could not save the barber', { description: error.message });
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? 'Edit barber' : 'Add a barber'}
      description={isEdit ? 'Update details, branch and the services they offer.' : 'Add a new member to your team.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={save.loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.loading} leftIcon={<Save className="h-4 w-4" />}>
            {isEdit ? 'Save changes' : 'Add barber'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3.5" noValidate>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input label="Full name" required error={errors.name?.message} {...register('name')} />
          <Input
            label="Specialization"
            required
            placeholder="Senior Barber"
            error={errors.specialization?.message}
            {...register('specialization')}
          />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Input label="Email" type="email" required error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" required error={errors.phone?.message} {...register('phone')} />
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <Input
            label="Years of experience"
            type="number"
            min={0}
            required
            error={errors.experience?.message}
            {...register('experience')}
          />
          <Input
            label="Chair number"
            type="number"
            min={1}
            required
            error={errors.chairNumber?.message}
            {...register('chairNumber')}
          />
          <Select label="Status" required error={errors.status?.message} {...register('status')}>
            {(Object.keys(BARBER_STATUS_META) as BarberStatus[]).map((value) => (
              <option key={value} value={value}>
                {BARBER_STATUS_META[value].label}
              </option>
            ))}
          </Select>
        </div>

        <Select label="Branch" required error={errors.locationId?.message} {...register('locationId')}>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name} — {location.city}
            </option>
          ))}
        </Select>

        <Textarea
          label="Bio"
          rows={3}
          placeholder="A short introduction shown on the public booking page."
          error={errors.bio?.message}
          {...register('bio')}
        />

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-700 dark:text-ink-200">
            Services offered <span className="text-danger-500">*</span>
          </legend>
          <div className="grid gap-2 rounded-xl border border-ink-200 p-3 sm:grid-cols-2 dark:border-white/10">
            {services.map((service) => (
              <Checkbox
                key={service.id}
                value={service.id}
                label={service.name}
                {...register('serviceIds')}
              />
            ))}
          </div>
          {errors.serviceIds && (
            <p className="mt-1.5 text-[13px] text-danger-600">{errors.serviceIds.message}</p>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
