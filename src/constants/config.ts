import type { CurrencyCode } from '@/types';

/** Parses a Vite env flag, treating anything other than an explicit "false" as true. */
const readBool = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() !== 'false' && value !== '0';
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'BarberFlow';
export const APP_TAGLINE = 'Simple bookings. Happier clients. A better barber business.';

/**
 * The single switch that decides which repository implementation the app binds
 * to. Nothing else in the codebase reads `import.meta.env` for this.
 */
export const USE_MOCK_API = readBool(import.meta.env.VITE_USE_MOCK_API, true);

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com/api';

export const DEFAULT_CURRENCY = (import.meta.env.VITE_DEFAULT_CURRENCY || 'USD') as CurrencyCode;
export const DEFAULT_TIMEZONE = import.meta.env.VITE_DEFAULT_TIMEZONE || 'America/New_York';
export const DEFAULT_LOCALE = 'en-US';

/** Simulated network latency for the mock repositories, in milliseconds. */
export const MOCK_LATENCY_MS = { min: 300, max: 700 } as const;

export const STORAGE_KEYS = {
  session: 'barberflow.session',
  theme: 'barberflow.theme',
  settings: 'barberflow.settings',
  sidebar: 'barberflow.sidebar.collapsed',
} as const;

export const DEMO_CREDENTIALS = {
  email: 'admin@barberflow.demo',
  password: 'Demo@123',
} as const;

/** Granularity of the booking grid and calendar rows, in minutes. */
export const SLOT_INTERVAL_MINUTES = 30;

/** Calendar day/week view bounds. */
export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 20;

export const DEFAULT_PAGE_SIZE = 10;
