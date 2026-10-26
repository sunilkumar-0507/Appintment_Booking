import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarCheck, Eye, Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Field';
import { LoadingSpinner, SkeletonCard } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/States';
import {
  BarberSelectCard,
  BookingSummary,
  DatePicker,
  ServiceCard,
  Stepper,
  SuccessAnimation,
  TimeSlotPicker,
} from '@/components/booking';
import { CustomerStep } from '@/components/appointments/CustomerStep';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useToast } from '@/context/ToastContext';
import { appointmentRepository, barberRepository, locationRepository, serviceRepository } from '@/services';
import { addDays, formatDate, toISODate, todayISO } from '@/utils/datetime';
import type { ApiError, Barber, Customer, Service } from '@/types';

const STEPS = [
  { label: 'Customer' },
  { label: 'Service' },
  { label: 'Barber' },
  { label: 'Date & Time' },
  { label: 'Confirm' },
];

export default function NewAppointmentPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);

  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const services = useAsyncData(() => serviceRepository.getServices({ activeOnly: true }), []);

  // Barbers are narrowed to those qualified for the chosen service.
  const barbers = useAsyncData(
    () => barberRepository.getBarbers({ serviceId: service?.id }),
    [service?.id],
    { enabled: Boolean(service) },
  );

  const availability = useAsyncData(
    () =>
      appointmentRepository.getAvailability({
        barberId: barber!.id,
        serviceId: service!.id,
        locationId: barber!.locationId,
        date,
      }),
    [barber?.id, service?.id, date],
    { enabled: Boolean(barber && service) && step === 3 },
  );

  const create = useAsyncAction(appointmentRepository.createAppointment.bind(appointmentRepository));

  const locationName = useMemo(
    () => locations.data?.find((entry) => entry.id === barber?.locationId)?.name,
    [locations.data, barber],
  );

  const canAdvance = [
    Boolean(customer),
    Boolean(service),
    Boolean(barber),
    Boolean(time),
    true,
  ][step];

  const goNext = () => setStep((current) => Math.min(current + 1, STEPS.length - 1));
  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const handleServiceSelect = (next: Service) => {
    setService(next);
    // A different service can invalidate the chosen barber and slot.
    if (barber && !next.barberIds.includes(barber.id)) setBarber(null);
    setTime('');
    setStep(2);
  };

  const handleBarberSelect = (next: Barber) => {
    setBarber(next);
    setTime('');
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!customer || !service || !barber || !time) return;

    try {
      const appointment = await create.run({
        customerId: customer.id,
        barberId: barber.id,
        serviceId: service.id,
        locationId: barber.locationId,
        date,
        startTime: time,
        status: 'confirmed',
        source: 'staff',
        notes: notes.trim() || undefined,
      });

      if (appointment) {
        setCreatedId(appointment.id);
        toast.success('Appointment confirmed.', {
          description: `${customer.name} is booked with ${barber.name} on ${formatDate(date)}.`,
        });
      }
    } catch (caught) {
      const error = caught as ApiError;
      toast.error('Could not book that slot', { description: error.message });
      // A 409 means the slot went while the form was open — send them back to pick again.
      if (error.status === 409) {
        setTime('');
        setStep(3);
        availability.refetch();
      }
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Success screen                                                          */
  /* ---------------------------------------------------------------------- */

  if (createdId) {
    return (
      <div className="mx-auto max-w-lg py-8">
        <Card className="text-center">
          <div className="flex flex-col items-center gap-4">
            <SuccessAnimation />
            <div>
              <h1 className="font-display text-2xl font-bold text-ink-900 dark:text-white">
                Appointment confirmed 🎉
              </h1>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
                {customer?.name} is booked in with {barber?.name}.
              </p>
            </div>
          </div>

          <BookingSummary
            className="mt-6 text-left"
            data={{
              customerName: customer?.name,
              serviceName: service?.name,
              serviceDuration: service?.duration,
              barberName: barber?.name,
              locationName,
              date,
              startTime: time,
              price: service?.price,
            }}
          />

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <Button
              fullWidth
              variant="outline"
              leftIcon={<Eye className="h-4 w-4" />}
              onClick={() => navigate(`/appointments/${createdId}`)}
            >
              View appointment
            </Button>
            <Button
              fullWidth
              variant="accent"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setCreatedId(null);
                setCustomer(null);
                setService(null);
                setBarber(null);
                setTime('');
                setNotes('');
                setStep(0);
              }}
            >
              Book another
            </Button>
          </div>

          <Link
            to="/appointments"
            className="mt-4 inline-block text-[13px] font-medium text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
          >
            Back to all appointments
          </Link>
        </Card>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Wizard                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <PageHeader
        title="New Appointment"
        description="Customer, service, barber, time — booked in under a minute."
        backTo={{ to: '/appointments', label: 'Appointments' }}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padded={false}>
            <div className="border-b border-ink-200/70 p-5 dark:border-white/[0.07]">
              <Stepper steps={STEPS} current={step} onStepClick={setStep} />
            </div>

            <div className="p-5">
              {/* Step 1 — Customer */}
              {step === 0 && (
                <section aria-label="Select customer">
                  <StepHeading title="Select Customer" subtitle="Search your client list or add someone new." />
                  {locations.loading ? (
                    <SkeletonCard />
                  ) : (
                    <CustomerStep
                      selected={customer}
                      onSelect={(next) => {
                        setCustomer(next);
                        setStep(1);
                      }}
                      locations={locations.data ?? []}
                    />
                  )}
                </section>
              )}

              {/* Step 2 — Service */}
              {step === 1 && (
                <section aria-label="Select service">
                  <StepHeading title="Select Service" subtitle="Pick what the customer is booking in for." />
                  {services.loading && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonCard key={index} lines={2} />
                      ))}
                    </div>
                  )}
                  {services.error && <ErrorState error={services.error} onRetry={services.refetch} compact />}
                  {services.data && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {services.data.map((entry) => (
                        <ServiceCard
                          key={entry.id}
                          service={entry}
                          selected={service?.id === entry.id}
                          onSelect={() => handleServiceSelect(entry)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Step 3 — Barber */}
              {step === 2 && (
                <section aria-label="Select barber">
                  <StepHeading
                    title="Select Barber"
                    subtitle={
                      service
                        ? `Showing barbers qualified for ${service.name}.`
                        : 'Choose who will take the appointment.'
                    }
                  />
                  {barbers.loading && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonCard key={index} lines={1} />
                      ))}
                    </div>
                  )}
                  {barbers.error && <ErrorState error={barbers.error} onRetry={barbers.refetch} compact />}
                  {barbers.data && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {barbers.data.map((entry) => (
                        <BarberSelectCard
                          key={entry.id}
                          barber={entry}
                          selected={barber?.id === entry.id}
                          onSelect={() => handleBarberSelect(entry)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Step 4 — Date & time */}
              {step === 3 && (
                <section aria-label="Select date and time">
                  <StepHeading
                    title="Select Date & Time"
                    subtitle={barber ? `${barber.name}'s availability.` : 'Pick a slot.'}
                  />
                  <div className="grid gap-6 md:grid-cols-[minmax(0,280px)_1fr]">
                    <DatePicker
                      value={date}
                      onChange={(next) => {
                        setDate(next);
                        setTime('');
                      }}
                      maxDate={toISODate(addDays(new Date(), 90))}
                    />

                    <div>
                      <p className="mb-2.5 text-[13px] font-medium text-ink-700 dark:text-ink-200">
                        {formatDate(date, 'EEEE, d MMMM')}
                      </p>
                      {availability.loading ? (
                        <div className="flex justify-center py-10">
                          <LoadingSpinner />
                        </div>
                      ) : availability.error ? (
                        <ErrorState error={availability.error} onRetry={availability.refetch} compact />
                      ) : (
                        <TimeSlotPicker
                          slots={availability.data ?? []}
                          value={time}
                          onChange={setTime}
                          emptyMessage={`${barber?.name ?? 'This barber'} is not working on this date.`}
                        />
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Step 5 — Confirm */}
              {step === 4 && (
                <section aria-label="Confirm appointment">
                  <StepHeading title="Confirmation" subtitle="Check the details before booking it in." />
                  <BookingSummary
                    data={{
                      customerName: customer?.name,
                      serviceName: service?.name,
                      serviceDuration: service?.duration,
                      barberName: barber?.name,
                      locationName,
                      date,
                      startTime: time,
                      price: service?.price,
                    }}
                  />
                  <Textarea
                    containerClassName="mt-4"
                    label="Notes (optional)"
                    placeholder="Anything the barber should know — preferred style, allergies, running late…"
                    rows={3}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                  />
                </section>
              )}
            </div>

            {/* Wizard footer */}
            <div className="flex items-center justify-between gap-3 border-t border-ink-200/70 p-4 dark:border-white/[0.07]">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={step === 0}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button onClick={goNext} disabled={!canAdvance} rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="accent"
                  loading={create.loading}
                  onClick={handleConfirm}
                  leftIcon={<CalendarCheck className="h-4 w-4" />}
                >
                  Confirm Appointment
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Live summary rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <BookingSummary
              title="Current selection"
              data={{
                customerName: customer?.name,
                serviceName: service?.name,
                serviceDuration: service?.duration,
                barberName: barber?.name,
                locationName,
                date: time ? date : undefined,
                startTime: time || undefined,
                price: service?.price,
              }}
            />
            {!customer && (
              <p className="mt-3 text-center text-[13px] text-ink-500 dark:text-ink-400">
                Your selections appear here as you go.
              </p>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-bold text-ink-900 dark:text-white">{title}</h2>
      <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">{subtitle}</p>
    </div>
  );
}
