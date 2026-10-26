import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  Clock,
  Mail,
  MapPin,
  Moon,
  Phone,
  Sun,
  Ticket,
  User,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Field';
import { LoadingSpinner, SkeletonCard } from '@/components/common/Loading';
import { ErrorState } from '@/components/common/States';
import {
  AnyBarberCard,
  BarberSelectCard,
  BookingSummary,
  DatePicker,
  LocationCard,
  ServiceCard,
  Stepper,
  SuccessAnimation,
  TimeSlotPicker,
} from '@/components/booking';
import { Logo } from '@/components/layout/Logo';
import { useAsyncData, useAsyncAction } from '@/hooks/useAsyncData';
import { useTheme } from '@/context/ThemeContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { appointmentRepository, barberRepository, locationRepository, serviceRepository } from '@/services';
import { APP_TAGLINE } from '@/constants/config';
import { addDays, formatDate, formatLongDate, toISODate, todayISO } from '@/utils/datetime';
import type { ApiError, AppointmentDetail, Barber, Location, Service } from '@/types';

const detailsSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.'),
  phone: z
    .string()
    .trim()
    .min(6, 'Please enter a phone number we can reach you on.')
    .regex(/^[+\d][\d\s()-]{5,}$/, 'Please enter a valid phone number.'),
  email: z.string().trim().min(1, 'Please enter your email.').email('Please enter a valid email.'),
  notes: z.string().max(400, 'Please keep notes under 400 characters.').optional(),
});

type DetailsValues = z.infer<typeof detailsSchema>;

const STEPS = [
  { label: 'Location' },
  { label: 'Service' },
  { label: 'Barber' },
  { label: 'Date & Time' },
  { label: 'Your details' },
];

export default function BookingPortalPage() {
  const { theme, toggleTheme } = useTheme();
  const { formatMoney } = useSettings();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [location, setLocation] = useState<Location | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [barber, setBarber] = useState<Barber | null>(null);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState('');
  const [booking, setBooking] = useState<AppointmentDetail | null>(null);

  const locations = useAsyncData(() => locationRepository.getLocations(), []);
  const services = useAsyncData(() => serviceRepository.getServices({ activeOnly: true }), []);

  const allBarbers = useAsyncData(
    () => barberRepository.getBarbers({ locationId: location?.id, serviceId: service?.id }),
    [location?.id, service?.id],
    { enabled: Boolean(location && service) },
  );

  // Barbers who can be booked publicly — disabled staff never appear.
  const bookableBarbers = useMemo(
    () => (allBarbers.data ?? []).filter((entry) => entry.status !== 'disabled'),
    [allBarbers.data],
  );

  const availability = useAsyncData(
    () =>
      appointmentRepository.getAvailability({
        barberId: barber!.id,
        serviceId: service!.id,
        locationId: location!.id,
        date,
      }),
    [barber?.id, service?.id, location?.id, date],
    { enabled: Boolean(barber && service && location) && step === 3 },
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DetailsValues>({ resolver: zodResolver(detailsSchema) });

  const submit = useAsyncAction(appointmentRepository.createPublicBooking.bind(appointmentRepository));

  const onConfirm = handleSubmit(async (values) => {
    if (!location || !service || !barber || !time) return;

    try {
      const created = await submit.run({
        locationId: location.id,
        serviceId: service.id,
        barberId: barber.id,
        date,
        startTime: time,
        customer: { fullName: values.fullName, email: values.email, phone: values.phone },
        notes: values.notes?.trim() || undefined,
      });
      if (created) setBooking(created);
    } catch (caught) {
      const error = caught as ApiError;
      Object.entries(error.fieldErrors ?? {}).forEach(([field, message]) => {
        if (field in detailsSchema.shape) setError(field as keyof DetailsValues, { message });
      });
      toast.error('We could not complete your booking', { description: error.message });
      if (error.status === 409) {
        setTime('');
        setStep(3);
        availability.refetch();
      }
    }
  });

  const canAdvance = [Boolean(location), Boolean(service), Boolean(barber), Boolean(time), true][step];

  /* ---------------------------------------------------------------------- */
  /* Confirmation                                                            */
  /* ---------------------------------------------------------------------- */

  if (booking) {
    return (
      <PortalShell theme={theme} onToggleTheme={toggleTheme}>
        <div className="mx-auto max-w-lg px-4 py-12 sm:py-16">
          <div className="surface-card overflow-hidden p-6 text-center sm:p-8">
            <div className="flex flex-col items-center gap-4">
              <SuccessAnimation />
              <div>
                <h1 className="font-display text-[26px] font-bold tracking-tight text-ink-900 dark:text-white">
                  Appointment Confirmed 🎉
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
                  Your appointment has been successfully booked. We have sent the details to{' '}
                  <span className="font-medium text-ink-700 dark:text-ink-200">{booking.customerEmail}</span>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl surface-muted px-4 py-3">
              <Ticket className="h-4 w-4 text-gold-500" aria-hidden />
              <span className="text-[13px] text-ink-500 dark:text-ink-400">Appointment ID</span>
              <span className="font-display text-base font-bold tracking-wide text-ink-900 dark:text-white">
                {booking.reference}
              </span>
            </div>

            <BookingSummary
              className="mt-5 text-left"
              title="Your appointment"
              data={{
                customerName: booking.customerName,
                serviceName: booking.serviceName,
                serviceDuration: booking.serviceDuration,
                barberName: booking.barberName,
                locationName: booking.locationName,
                date: booking.date,
                startTime: booking.startTime,
                price: booking.price,
              }}
            />

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                fullWidth
                variant="outline"
                leftIcon={<CalendarPlus className="h-4 w-4" />}
                onClick={() => downloadCalendarEvent(booking)}
              >
                Add to Calendar
              </Button>
              <Button
                fullWidth
                variant="accent"
                onClick={() => {
                  setBooking(null);
                  setStep(0);
                  setLocation(null);
                  setService(null);
                  setBarber(null);
                  setTime('');
                }}
              >
                Book another
              </Button>
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
              Need to change something? Call {location?.phone ?? 'the shop'} and quote{' '}
              <span className="font-medium text-ink-700 dark:text-ink-200">{booking.reference}</span>.
            </p>
          </div>
        </div>
      </PortalShell>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Wizard                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <PortalShell theme={theme} onToggleTheme={toggleTheme}>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-950">
        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 25%, rgba(227,165,52,0.6), transparent 45%), radial-gradient(circle at 85% 60%, rgba(227,165,52,0.3), transparent 50%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-4xl px-4 py-12 text-center sm:py-16">
          <h1 className="font-display text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Book Your Appointment
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-300">
            Pick your branch, your barber and a time that suits you. It takes about thirty seconds.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold-400" aria-hidden /> Instant confirmation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold-400" aria-hidden /> Free cancellation
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-gold-400" aria-hidden /> No account needed
            </span>
          </div>
        </div>
      </section>

      {/* Wizard */}
      <div className="mx-auto max-w-4xl px-4 pb-16">
        <div className="surface-card -mt-8 overflow-hidden sm:-mt-10">
          <div className="border-b border-ink-200/70 p-5 dark:border-white/[0.07]">
            <Stepper steps={STEPS} current={step} onStepClick={setStep} />
          </div>

          <div className="p-5 sm:p-6">
            {/* Step 1 — Location */}
            {step === 0 && (
              <StepSection title="Choose Location" subtitle="Where would you like to be seen?">
                {locations.loading && (
                  <div className="grid gap-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <SkeletonCard key={index} lines={1} />
                    ))}
                  </div>
                )}
                {locations.error && <ErrorState error={locations.error} onRetry={locations.refetch} compact />}
                <div className="grid gap-3">
                  {locations.data?.map((entry) => (
                    <LocationCard
                      key={entry.id}
                      location={entry}
                      selected={location?.id === entry.id}
                      onSelect={() => {
                        setLocation(entry);
                        setBarber(null);
                        setTime('');
                        setStep(1);
                      }}
                    />
                  ))}
                </div>
              </StepSection>
            )}

            {/* Step 2 — Service */}
            {step === 1 && (
              <StepSection title="Choose Service" subtitle="What are you booking in for?">
                {services.loading && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={index} lines={2} />
                    ))}
                  </div>
                )}
                {services.error && <ErrorState error={services.error} onRetry={services.refetch} compact />}
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.data?.map((entry) => (
                    <ServiceCard
                      key={entry.id}
                      service={entry}
                      selected={service?.id === entry.id}
                      onSelect={() => {
                        setService(entry);
                        if (barber && !entry.barberIds.includes(barber.id)) setBarber(null);
                        setTime('');
                        setStep(2);
                      }}
                    />
                  ))}
                </div>
              </StepSection>
            )}

            {/* Step 3 — Barber */}
            {step === 2 && (
              <StepSection title="Choose Barber" subtitle="Pick a favourite, or let us match you.">
                {allBarbers.loading && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <SkeletonCard key={index} lines={1} />
                    ))}
                  </div>
                )}
                {allBarbers.error && <ErrorState error={allBarbers.error} onRetry={allBarbers.refetch} compact />}

                {!allBarbers.loading && bookableBarbers.length === 0 && allBarbers.data && (
                  <p className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500 dark:border-white/10 dark:text-ink-400">
                    No barber at this branch offers {service?.name}. Try another branch or service.
                  </p>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {bookableBarbers.length > 1 && (
                    <AnyBarberCard
                      selected={false}
                      onSelect={() => {
                        // "No preference" resolves to the first bookable chair.
                        const first = bookableBarbers[0];
                        setBarber(first);
                        setTime('');
                        setStep(3);
                      }}
                    />
                  )}
                  {bookableBarbers.map((entry) => (
                    <BarberSelectCard
                      key={entry.id}
                      barber={entry}
                      showStatus={false}
                      selected={barber?.id === entry.id}
                      onSelect={() => {
                        setBarber(entry);
                        setTime('');
                        setStep(3);
                      }}
                    />
                  ))}
                </div>
              </StepSection>
            )}

            {/* Step 4 — Date & time */}
            {step === 3 && (
              <StepSection title="Choose Date & Time" subtitle="Green times are free — pick what suits you.">
                <div className="grid gap-6 md:grid-cols-[minmax(0,290px)_1fr]">
                  <DatePicker
                    value={date}
                    onChange={(next) => {
                      setDate(next);
                      setTime('');
                    }}
                    maxDate={toISODate(addDays(new Date(), 60))}
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
                        emptyMessage={`${barber?.name ?? 'This barber'} is fully booked or off on this date. Try another day.`}
                      />
                    )}
                  </div>
                </div>
              </StepSection>
            )}

            {/* Step 5 — Details */}
            {step === 4 && (
              <StepSection title="Your Details" subtitle="So we know who is coming in.">
                <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,300px)]">
                  <form onSubmit={onConfirm} className="space-y-3.5" noValidate>
                    <Input
                      label="Full name"
                      required
                      leftIcon={<User className="h-4 w-4" />}
                      placeholder="Alex Morgan"
                      error={errors.fullName?.message}
                      {...register('fullName')}
                    />
                    <Input
                      label="Phone"
                      required
                      type="tel"
                      leftIcon={<Phone className="h-4 w-4" />}
                      placeholder="+44 7700 900000"
                      error={errors.phone?.message}
                      {...register('phone')}
                    />
                    <Input
                      label="Email"
                      required
                      type="email"
                      leftIcon={<Mail className="h-4 w-4" />}
                      placeholder="you@example.com"
                      hint="We'll send your confirmation here."
                      error={errors.email?.message}
                      {...register('email')}
                    />
                    <Textarea
                      label="Notes (optional)"
                      rows={3}
                      placeholder="Anything your barber should know?"
                      error={errors.notes?.message}
                      {...register('notes')}
                    />
                  </form>

                  <div className="lg:sticky lg:top-6 lg:self-start">
                    <BookingSummary
                      title="Your booking"
                      data={{
                        serviceName: service?.name,
                        serviceDuration: service?.duration,
                        barberName: barber?.name,
                        locationName: location?.name,
                        date,
                        startTime: time,
                        price: service?.price,
                      }}
                    />
                  </div>
                </div>
              </StepSection>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-ink-200/70 p-4 dark:border-white/[0.07]">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
                disabled={!canAdvance}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button variant="accent" size="lg" loading={submit.loading} onClick={onConfirm}>
                Confirm Booking · {service ? formatMoney(service.price) : ''}
              </Button>
            )}
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <TrustItem
            icon={<Clock className="h-4 w-4" />}
            title="Under a minute"
            body="Five quick steps and you're booked in."
          />
          <TrustItem
            icon={<MapPin className="h-4 w-4" />}
            title="Three branches"
            body="London, Manchester and Brighton."
          />
          <TrustItem
            icon={<Check className="h-4 w-4" />}
            title="Free cancellation"
            body="Change your plans up to 12 hours before."
          />
        </div>
      </div>
    </PortalShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Portal chrome                                                               */
/* -------------------------------------------------------------------------- */

function PortalShell({
  children,
  theme,
  onToggleTheme,
}: {
  children: React.ReactNode;
  theme: string;
  onToggleTheme: () => void;
}) {
  return (
    <div className="min-h-screen bg-[rgb(var(--surface-page))]">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-[rgb(var(--surface-page))]/85 backdrop-blur-xl dark:border-white/[0.07]">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>
            <Link to="/login">
              <Button variant="outline" size="sm">
                Shop login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-ink-200/70 py-8 dark:border-white/[0.07]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Logo size="sm" />
          <p className="mt-3 text-[13px] text-ink-500 dark:text-ink-400">{APP_TAGLINE}</p>
        </div>
      </footer>
    </div>
  );
}

function StepSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up" aria-label={title}>
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold text-ink-900 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function TrustItem({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ink-200/70 p-4 dark:border-white/[0.07]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-gold-400 dark:bg-white/[0.08]">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink-900 dark:text-white">{title}</span>
        <span className="block text-[13px] text-ink-500 dark:text-ink-400">{body}</span>
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Calendar export                                                             */
/* -------------------------------------------------------------------------- */

/** Builds a downloadable `.ics` file so the customer can add the slot to their calendar. */
function downloadCalendarEvent(booking: AppointmentDetail): void {
  const stamp = (date: string, time: string) =>
    `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BarberFlow//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${booking.reference}@barberflow.demo`,
    `DTSTAMP:${stamp(booking.date, booking.startTime)}`,
    `DTSTART:${stamp(booking.date, booking.startTime)}`,
    `DTEND:${stamp(booking.date, booking.endTime)}`,
    `SUMMARY:${booking.serviceName} with ${booking.barberName}`,
    `DESCRIPTION:BarberFlow booking ${booking.reference} — ${formatLongDate(booking.date)}`,
    `LOCATION:${booking.locationName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `barberflow-${booking.reference}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
