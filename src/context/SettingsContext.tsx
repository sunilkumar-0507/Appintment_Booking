import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppSettings, CurrencyCode } from '@/types';
import { defaultSettings } from '@/mock/settings';
import { settingsRepository } from '@/services';
import { formatCurrency as formatCurrencyRaw } from '@/utils/currency';
import { formatDate as formatDateRaw, formatTime as formatTimeRaw } from '@/utils/datetime';

interface SettingsContextValue {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>;
  /** Currency formatter already bound to the shop's currency and locale. */
  formatMoney: (amount: number, options?: { notation?: 'standard' | 'compact' }) => string;
  /** Date formatter honouring the configured date format. */
  formatDate: (value: string | Date) => string;
  /** Time formatter honouring the 12h/24h preference. */
  formatTime: (time: string) => string;
  currency: CurrencyCode;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Our display patterns keyed by the stored format preference. */
const DATE_PATTERNS: Record<string, string> = {
  'MM/dd/yyyy': 'MMM d, yyyy',
  'dd/MM/yyyy': 'd MMM yyyy',
  'yyyy-MM-dd': 'yyyy-MM-dd',
  'dd MMM yyyy': 'd MMM yyyy',
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    settingsRepository
      .getSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch(() => {
        // Settings are non-critical — fall back to the defaults already in state.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const saved = await settingsRepository.updateSettings(patch);
    setSettings(saved);
    return saved;
  }, []);

  const value = useMemo<SettingsContextValue>(() => {
    const { currency, locale, dateFormat, timeFormat } = settings.shop;

    return {
      settings,
      loading,
      updateSettings,
      currency,
      formatMoney: (amount, options) =>
        formatCurrencyRaw(amount, { currency, locale, notation: options?.notation }),
      formatDate: (dateValue) => formatDateRaw(dateValue, DATE_PATTERNS[dateFormat] ?? 'MMM d, yyyy'),
      formatTime: (time) => formatTimeRaw(time, timeFormat === '12h'),
    };
  }, [settings, loading, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside <SettingsProvider>.');
  return context;
}
