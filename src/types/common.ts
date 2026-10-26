/** Shared primitives used across every domain model and repository. */

export type ID = string;

/** ISO date, `yyyy-MM-dd`. Kept as a string so it survives JSON transport untouched. */
export type ISODate = string;

/** 24h clock time, `HH:mm`. */
export type TimeString = string;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export type SortDirection = 'asc' | 'desc';

/** Normalised error shape produced by the Axios interceptors and the mock layer alike. */
export interface ApiError {
  /** HTTP status, or 0 when the request never reached the server. */
  status: number;
  /** User-facing, already-friendly message. Safe to render directly. */
  message: string;
  /** Field-level validation messages, keyed by field name (HTTP 422). */
  fieldErrors?: Record<string, string>;
  /** Machine-readable code for programmatic handling. */
  code?: string;
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

export interface DayHours {
  /** Whether the shop / barber works on this weekday at all. */
  open: boolean;
  opensAt: TimeString;
  closesAt: TimeString;
}

export type WeekdayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export type WeeklyHours = Record<WeekdayKey, DayHours>;
