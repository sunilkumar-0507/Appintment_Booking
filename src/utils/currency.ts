import { CURRENCIES } from '@/constants/domain';
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/constants/config';
import type { CurrencyCode } from '@/types';

export interface CurrencyFormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  /** Drop the decimals — used for axis ticks and large KPI figures. */
  compactDecimals?: boolean;
  /** Abbreviate thousands/millions, e.g. `$12.4k`. */
  notation?: 'standard' | 'compact';
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  currency: CurrencyCode,
  locale: string,
  fractionDigits: number,
  notation: 'standard' | 'compact',
): Intl.NumberFormat {
  const key = `${currency}|${locale}|${fractionDigits}|${notation}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * The single place currency is turned into text. No component builds a price
 * string by concatenating a symbol — switching the shop to GBP or INR only
 * changes the value passed in here.
 */
export function formatCurrency(amount: number, options: CurrencyFormatOptions = {}): string {
  const currency = options.currency ?? DEFAULT_CURRENCY;
  const locale = options.locale ?? CURRENCIES[currency]?.locale ?? DEFAULT_LOCALE;
  const fractionDigits = options.compactDecimals || Number.isInteger(amount) ? 0 : 2;

  try {
    return getFormatter(currency, locale, fractionDigits, options.notation ?? 'standard').format(amount);
  } catch {
    // Unknown currency/locale pair — fall back to the symbol table.
    const symbol = CURRENCIES[currency]?.symbol ?? '';
    return `${symbol}${amount.toFixed(fractionDigits)}`;
  }
}

export function currencySymbol(currency: CurrencyCode = DEFAULT_CURRENCY): string {
  return CURRENCIES[currency]?.symbol ?? '$';
}

/** Compact numeric formatting for non-monetary stats (visits, bookings…). */
export function formatNumber(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPercent(value: number, fractionDigits = 1): string {
  const rounded = Number(value.toFixed(fractionDigits));
  return `${rounded > 0 ? '+' : ''}${rounded}%`;
}
