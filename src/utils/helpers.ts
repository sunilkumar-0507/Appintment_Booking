/** Small pure helpers shared across repositories and UI. */

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Percentage change from `previous` to `current`, guarding division by zero. */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export function groupBy<T, K extends string | number>(items: T[], key: (item: T) => K): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const k = key(item);
    (acc[k] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sum<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Combining diacritical marks — stripped so "José" matches a "jose" query. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Case- and diacritic-insensitive substring match used by every search box. */
export function matchesQuery(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  const normalise = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(COMBINING_MARKS, '');
  return normalise(haystack).includes(normalise(query.trim()));
}

/** Deterministic pseudo-random generator so demo data is stable across reloads. */
export function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function pickFrom<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Stable id generator for demo records created at runtime. */
let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`;
}

export function generateReference(): string {
  return `BF-${Math.floor(1000 + Math.random() * 9000)}`;
}
