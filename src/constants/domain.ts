import type {
  AppointmentStatus,
  CurrencyCode,
  CustomerStatus,
  DateFormatKey,
  DateRangeKey,
  SelectOption,
  ServiceCategory,
  BarberStatus,
  WeekdayKey,
} from '@/types';

/* -------------------------------------------------------------------------- */
/* Appointment status                                                          */
/* -------------------------------------------------------------------------- */

export interface StatusMeta {
  label: string;
  /** Tailwind classes for the badge in light + dark. */
  badge: string;
  /** Solid dot / calendar accent colour. */
  dot: string;
  /** Hex used by charts and calendar blocks. */
  hex: string;
}

export const APPOINTMENT_STATUS_META: Record<AppointmentStatus, StatusMeta> = {
  pending: {
    label: 'Pending',
    badge:
      'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-100',
    dot: 'bg-warning-500',
    hex: '#f79009',
  },
  confirmed: {
    label: 'Confirmed',
    badge:
      'bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20 dark:bg-info-500/10 dark:text-info-100',
    dot: 'bg-info-500',
    hex: '#2e90fa',
  },
  completed: {
    label: 'Completed',
    badge:
      'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20 dark:bg-success-500/10 dark:text-success-100',
    dot: 'bg-success-500',
    hex: '#12b76a',
  },
  cancelled: {
    label: 'Cancelled',
    badge:
      'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-500/10 dark:text-danger-100',
    dot: 'bg-danger-500',
    hex: '#f04438',
  },
  'no-show': {
    label: 'No-show',
    badge:
      'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-500/20 dark:bg-white/10 dark:text-ink-100',
    dot: 'bg-ink-500',
    hex: '#6b6b73',
  },
};

export const APPOINTMENT_STATUSES = Object.keys(APPOINTMENT_STATUS_META) as AppointmentStatus[];

export const APPOINTMENT_STATUS_OPTIONS: SelectOption<AppointmentStatus | 'all'>[] = [
  { value: 'all', label: 'All statuses' },
  ...APPOINTMENT_STATUSES.map((status) => ({
    value: status,
    label: APPOINTMENT_STATUS_META[status].label,
  })),
];

/* -------------------------------------------------------------------------- */
/* Customer status                                                             */
/* -------------------------------------------------------------------------- */

export const CUSTOMER_STATUS_META: Record<CustomerStatus, StatusMeta> = {
  new: {
    label: 'New',
    badge:
      'bg-info-50 text-info-700 ring-1 ring-inset ring-info-500/20 dark:bg-info-500/10 dark:text-info-100',
    dot: 'bg-info-500',
    hex: '#2e90fa',
  },
  active: {
    label: 'Active',
    badge:
      'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20 dark:bg-success-500/10 dark:text-success-100',
    dot: 'bg-success-500',
    hex: '#12b76a',
  },
  returning: {
    label: 'Returning',
    badge:
      'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-500/20 dark:bg-white/10 dark:text-ink-100',
    dot: 'bg-ink-400',
    hex: '#88888f',
  },
  vip: {
    label: 'VIP',
    badge:
      'bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-500/25 dark:bg-gold-400/15 dark:text-gold-200',
    dot: 'bg-gold-400',
    hex: '#e3a534',
  },
  inactive: {
    label: 'Inactive',
    badge:
      'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-400/20 dark:bg-white/5 dark:text-ink-400',
    dot: 'bg-ink-300',
    hex: '#b0b0b8',
  },
};

/* -------------------------------------------------------------------------- */
/* Barber status                                                               */
/* -------------------------------------------------------------------------- */

export const BARBER_STATUS_META: Record<BarberStatus, StatusMeta> = {
  available: {
    label: 'Available',
    badge:
      'bg-success-50 text-success-700 ring-1 ring-inset ring-success-500/20 dark:bg-success-500/10 dark:text-success-100',
    dot: 'bg-success-500',
    hex: '#12b76a',
  },
  busy: {
    label: 'With a client',
    badge:
      'bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-100',
    dot: 'bg-warning-500',
    hex: '#f79009',
  },
  off: {
    label: 'Day off',
    badge:
      'bg-ink-100 text-ink-600 ring-1 ring-inset ring-ink-400/20 dark:bg-white/10 dark:text-ink-200',
    dot: 'bg-ink-400',
    hex: '#88888f',
  },
  disabled: {
    label: 'Disabled',
    badge:
      'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-500/10 dark:text-danger-100',
    dot: 'bg-danger-500',
    hex: '#f04438',
  },
};

/* -------------------------------------------------------------------------- */
/* Services                                                                    */
/* -------------------------------------------------------------------------- */

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hair: 'Hair',
  beard: 'Beard',
  shave: 'Shave',
  styling: 'Styling',
  treatment: 'Treatment',
  package: 'Package',
};

export const SERVICE_CATEGORY_OPTIONS: SelectOption<ServiceCategory>[] = (
  Object.keys(SERVICE_CATEGORY_LABELS) as ServiceCategory[]
).map((value) => ({ value, label: SERVICE_CATEGORY_LABELS[value] }));

/* -------------------------------------------------------------------------- */
/* Calendar / weekdays                                                         */
/* -------------------------------------------------------------------------- */

export const WEEKDAYS: { key: WeekdayKey; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

/** `Date#getDay()` (0 = Sunday) → our weekday key. */
export const WEEKDAY_BY_INDEX: WeekdayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/* -------------------------------------------------------------------------- */
/* Internationalisation                                                        */
/* -------------------------------------------------------------------------- */

export interface CurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  USD: { code: 'USD', label: 'US Dollar', symbol: '$', locale: 'en-US' },
  GBP: { code: 'GBP', label: 'British Pound', symbol: '£', locale: 'en-GB' },
  EUR: { code: 'EUR', label: 'Euro', symbol: '€', locale: 'de-DE' },
  AUD: { code: 'AUD', label: 'Australian Dollar', symbol: 'A$', locale: 'en-AU' },
  CAD: { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA' },
  AED: { code: 'AED', label: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE' },
  INR: { code: 'INR', label: 'Indian Rupee', symbol: '₹', locale: 'en-IN' },
};

export const CURRENCY_OPTIONS: SelectOption<CurrencyCode>[] = (
  Object.keys(CURRENCIES) as CurrencyCode[]
).map((code) => ({
  value: code,
  label: `${CURRENCIES[code].code} — ${CURRENCIES[code].label} (${CURRENCIES[code].symbol})`,
}));

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'America/New_York', label: 'America/New_York (EST)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST)' },
  { value: 'America/Toronto', label: 'America/Toronto (EST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST)' },
];

export const COUNTRY_OPTIONS: SelectOption[] = [
  { value: 'United States', label: '🇺🇸 United States' },
  { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australia' },
  { value: 'Germany', label: '🇩🇪 Germany' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'United Arab Emirates', label: '🇦🇪 United Arab Emirates' },
  { value: 'India', label: '🇮🇳 India' },
];

export const DATE_FORMAT_OPTIONS: SelectOption<DateFormatKey>[] = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY — 08/16/2026' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY — 16/08/2026' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD — 2026-08-16' },
  { value: 'dd MMM yyyy', label: 'DD MMM YYYY — 16 Aug 2026' },
];

/* -------------------------------------------------------------------------- */
/* Reporting ranges                                                            */
/* -------------------------------------------------------------------------- */

export const DASHBOARD_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

export const REPORT_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: '7 Days' },
  { value: 'month', label: '30 Days' },
  { value: 'quarter', label: '3 Months' },
  { value: 'year', label: '12 Months' },
];

/** Palette used for multi-series charts, ordered for good adjacent contrast. */
export const CHART_COLORS = [
  '#e3a534',
  '#2e90fa',
  '#12b76a',
  '#9b8afb',
  '#f79009',
  '#f04438',
  '#0ba5ec',
  '#ee46bc',
];
