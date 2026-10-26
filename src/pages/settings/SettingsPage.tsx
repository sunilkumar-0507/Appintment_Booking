import { useEffect, useState } from 'react';
import { Bell, Building2, CalendarClock, Clock, Moon, Save, Sun } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardHeader } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Select, Switch, Textarea } from '@/components/common/Field';
import { Tabs } from '@/components/common/Tabs';
import { PageLoader } from '@/components/common/Loading';
import { useSettings } from '@/context/SettingsContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAsyncAction } from '@/hooks/useAsyncData';
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIMEZONE_OPTIONS,
  WEEKDAYS,
} from '@/constants/domain';
import { APP_NAME, USE_MOCK_API, API_BASE_URL } from '@/constants/config';
import { cn } from '@/utils/cn';
import type { AppSettings, ApiError, CurrencyCode, DateFormatKey, WeekdayKey } from '@/types';

type SettingsTab = 'shop' | 'hours' | 'booking' | 'notifications';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [tab, setTab] = useState<SettingsTab>('shop');
  const [draft, setDraft] = useState<AppSettings>(settings);
  const [dirty, setDirty] = useState(false);

  // Adopt server state until the user starts editing, so a slow load never
  // clobbers something they have already typed.
  useEffect(() => {
    if (!dirty) setDraft(settings);
  }, [settings, dirty]);

  const save = useAsyncAction(updateSettings);

  const patch = <K extends keyof AppSettings>(key: K, value: Partial<AppSettings[K]>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, [key]: { ...(current[key] as object), ...value } }));
  };

  const patchDay = (day: WeekdayKey, value: Partial<AppSettings['businessHours'][WeekdayKey]>) => {
    setDirty(true);
    setDraft((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: { ...current.businessHours[day], ...value },
      },
    }));
  };

  const handleSave = async () => {
    try {
      await save.run(draft);
      setDirty(false);
      toast.success('Settings saved.', { description: 'Your changes are live across the app.' });
    } catch (caught) {
      toast.error('Could not save settings', { description: (caught as ApiError).message });
    }
  };

  if (loading) return <PageLoader message="Loading settings…" />;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Shop profile, opening hours, booking rules and notifications."
        actions={
          <Button
            variant="accent"
            onClick={handleSave}
            loading={save.loading}
            disabled={!dirty}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {dirty ? 'Save changes' : 'Saved'}
          </Button>
        }
      />

      <Tabs
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'shop', label: 'Shop', icon: <Building2 className="h-4 w-4" /> },
          { value: 'hours', label: 'Business Hours', icon: <Clock className="h-4 w-4" /> },
          { value: 'booking', label: 'Booking', icon: <CalendarClock className="h-4 w-4" /> },
          { value: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
        ]}
      />

      {/* Shop -------------------------------------------------------------- */}
      {tab === 'shop' && (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader title="Shop settings" description="How your business appears to customers." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Shop name"
                containerClassName="sm:col-span-2"
                value={draft.shop.name}
                onChange={(event) => patch('shop', { name: event.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={draft.shop.email}
                onChange={(event) => patch('shop', { email: event.target.value })}
              />
              <Input
                label="Phone"
                type="tel"
                value={draft.shop.phone}
                onChange={(event) => patch('shop', { phone: event.target.value })}
              />
              <Input
                label="Address"
                containerClassName="sm:col-span-2"
                value={draft.shop.addressLine1}
                onChange={(event) => patch('shop', { addressLine1: event.target.value })}
              />
              <Input
                label="City"
                value={draft.shop.city}
                onChange={(event) => patch('shop', { city: event.target.value })}
              />
              <Input
                label="Postal code"
                value={draft.shop.postalCode}
                onChange={(event) => patch('shop', { postalCode: event.target.value })}
              />
              <Select
                label="Country"
                containerClassName="sm:col-span-2"
                value={draft.shop.country}
                onChange={(event) => patch('shop', { country: event.target.value })}
              >
                {COUNTRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader
                title="Internationalisation"
                description="Currency and dates update everywhere instantly."
              />
              <div className="mt-5 space-y-4">
                <Select
                  label="Currency"
                  value={draft.shop.currency}
                  onChange={(event) => patch('shop', { currency: event.target.value as CurrencyCode })}
                >
                  {CURRENCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Timezone"
                  value={draft.shop.timezone}
                  onChange={(event) => patch('shop', { timezone: event.target.value })}
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Date format"
                  value={draft.shop.dateFormat}
                  onChange={(event) => patch('shop', { dateFormat: event.target.value as DateFormatKey })}
                >
                  {DATE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Time format"
                  value={draft.shop.timeFormat}
                  onChange={(event) =>
                    patch('shop', { timeFormat: event.target.value as '12h' | '24h' })
                  }
                >
                  <option value="12h">12-hour — 2:30 PM</option>
                  <option value="24h">24-hour — 14:30</option>
                </Select>
              </div>
            </Card>

            <Card>
              <CardHeader title="Appearance" description="Applies to this device." />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    theme === 'light'
                      ? 'border-gold-400 bg-gold-50 text-ink-900 ring-2 ring-gold-400/25'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300 dark:border-white/10 dark:text-ink-300',
                  )}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all',
                    theme === 'dark'
                      ? 'border-gold-400 bg-gold-400/10 text-white ring-2 ring-gold-400/25'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300 dark:border-white/10 dark:text-ink-300',
                  )}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Data source" description="How this build reaches its data." />
              <dl className="mt-4 space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500 dark:text-ink-400">Mode</dt>
                  <dd
                    className={cn(
                      'rounded-md px-2 py-0.5 font-medium',
                      USE_MOCK_API
                        ? 'bg-gold-100 text-gold-700 dark:bg-gold-400/15 dark:text-gold-300'
                        : 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-100',
                    )}
                  >
                    {USE_MOCK_API ? 'Demo data' : 'Live REST API'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-ink-500 dark:text-ink-400">API base</dt>
                  <dd className="truncate font-medium text-ink-700 dark:text-ink-200">{API_BASE_URL}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink-500 dark:text-ink-400">App</dt>
                  <dd className="font-medium text-ink-700 dark:text-ink-200">{APP_NAME}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                Set <code className="rounded surface-muted px-1 py-0.5">VITE_USE_MOCK_API=false</code> to
                point the same UI at your REST API.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Business hours ---------------------------------------------------- */}
      {tab === 'hours' && (
        <Card className="max-w-3xl">
          <CardHeader
            title="Business hours"
            description="Used as the default for new barbers and the public booking page."
          />
          <ul className="mt-5 space-y-2">
            {WEEKDAYS.map((weekday) => {
              const day = draft.businessHours[weekday.key];
              return (
                <li
                  key={weekday.key}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-200/70 p-3.5 dark:border-white/[0.07]"
                >
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">{weekday.label}</p>
                  </div>

                  <div className="shrink-0">
                    <Switch
                      id={`open-${weekday.key}`}
                      checked={day.open}
                      onChange={(open) => patchDay(weekday.key, { open })}
                      label={day.open ? 'Open' : 'Closed'}
                    />
                  </div>

                  <div
                    className={cn(
                      'ml-auto flex items-center gap-2 transition-opacity',
                      !day.open && 'pointer-events-none opacity-40',
                    )}
                  >
                    <input
                      type="time"
                      aria-label={`${weekday.label} opening time`}
                      value={day.opensAt}
                      onChange={(event) => patchDay(weekday.key, { opensAt: event.target.value })}
                      className="h-9 rounded-lg border border-ink-200 bg-[rgb(var(--surface-card))] px-2.5 text-sm text-ink-900 outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
                    />
                    <span className="text-ink-400">–</span>
                    <input
                      type="time"
                      aria-label={`${weekday.label} closing time`}
                      value={day.closesAt}
                      onChange={(event) => patchDay(weekday.key, { closesAt: event.target.value })}
                      className="h-9 rounded-lg border border-ink-200 bg-[rgb(var(--surface-card))] px-2.5 text-sm text-ink-900 outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 dark:border-white/10 dark:text-white dark:[color-scheme:dark]"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Booking ----------------------------------------------------------- */}
      {tab === 'booking' && (
        <div className="grid max-w-4xl gap-5">
          <Card>
            <CardHeader title="Booking settings" description="Rules applied to online bookings." />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <Input
                label="Minimum notice (hours)"
                type="number"
                min={0}
                hint="How far ahead customers must book."
                value={draft.booking.minimumNoticeHours}
                onChange={(event) =>
                  patch('booking', { minimumNoticeHours: Number(event.target.value) })
                }
              />
              <Input
                label="Maximum advance (days)"
                type="number"
                min={1}
                hint="How far into the future bookings open."
                value={draft.booking.maximumAdvanceDays}
                onChange={(event) => patch('booking', { maximumAdvanceDays: Number(event.target.value) })}
              />
              <Input
                label="Slot interval (minutes)"
                type="number"
                min={5}
                step={5}
                hint="Spacing of selectable times."
                value={draft.booking.slotIntervalMinutes}
                onChange={(event) => patch('booking', { slotIntervalMinutes: Number(event.target.value) })}
              />
            </div>

            <div className="mt-5 space-y-4 border-t border-ink-200/70 pt-5 dark:border-white/[0.07]">
              <Switch
                id="allow-online"
                checked={draft.booking.allowOnlineBooking}
                onChange={(allowOnlineBooking) => patch('booking', { allowOnlineBooking })}
                label="Allow online booking"
                description="Lets customers book themselves through the public portal at /book."
              />
              <Switch
                id="require-deposit"
                checked={draft.booking.requireDeposit}
                onChange={(requireDeposit) => patch('booking', { requireDeposit })}
                label="Require a deposit"
                description="Ask for card details to hold the slot."
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Cancellation policy" description="Shown to customers before they confirm." />
            <div className="mt-5 space-y-4">
              <Input
                label="Free cancellation window (hours)"
                type="number"
                min={0}
                containerClassName="sm:max-w-xs"
                value={draft.booking.cancellationWindowHours}
                onChange={(event) =>
                  patch('booking', { cancellationWindowHours: Number(event.target.value) })
                }
              />
              <Textarea
                label="Policy text"
                rows={4}
                value={draft.booking.cancellationPolicy}
                onChange={(event) => patch('booking', { cancellationPolicy: event.target.value })}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Notifications ----------------------------------------------------- */}
      {tab === 'notifications' && (
        <Card className="max-w-3xl">
          <CardHeader
            title="Notification settings"
            description="What BarberFlow sends, and to whom."
          />
          <div className="mt-5 space-y-5">
            <Switch
              id="email-notifications"
              checked={draft.notifications.emailNotifications}
              onChange={(emailNotifications) => patch('notifications', { emailNotifications })}
              label="Email notifications"
              description="Booking confirmations and changes sent by email."
            />
            <Switch
              id="sms-notifications"
              checked={draft.notifications.smsNotifications}
              onChange={(smsNotifications) => patch('notifications', { smsNotifications })}
              label="SMS notifications"
              description="Text confirmations — higher open rates, per-message cost."
            />
            <Switch
              id="appointment-reminders"
              checked={draft.notifications.appointmentReminders}
              onChange={(appointmentReminders) => patch('notifications', { appointmentReminders })}
              label="Appointment reminders"
              description="Automatic reminder before the appointment to cut no-shows."
            />

            <div className={cn('transition-opacity', !draft.notifications.appointmentReminders && 'opacity-40')}>
              <Input
                label="Reminder lead time (hours)"
                type="number"
                min={1}
                max={72}
                containerClassName="sm:max-w-xs"
                disabled={!draft.notifications.appointmentReminders}
                value={draft.notifications.reminderLeadHours}
                onChange={(event) =>
                  patch('notifications', { reminderLeadHours: Number(event.target.value) })
                }
              />
            </div>

            <div className="space-y-5 border-t border-ink-200/70 pt-5 dark:border-white/[0.07]">
              <Switch
                id="staff-digest"
                checked={draft.notifications.staffDailyDigest}
                onChange={(staffDailyDigest) => patch('notifications', { staffDailyDigest })}
                label="Staff daily digest"
                description="Morning summary of the day's schedule for every barber."
              />
              <Switch
                id="marketing-emails"
                checked={draft.notifications.marketingEmails}
                onChange={(marketingEmails) => patch('notifications', { marketingEmails })}
                label="Marketing emails"
                description="Promotions and win-back campaigns to lapsed customers."
              />
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
