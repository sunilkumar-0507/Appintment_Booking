import axios from 'axios';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/constants/config';
import type { ApiError, AuthSession } from '@/types';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/* -------------------------------------------------------------------------- */
/* Session helpers                                                             */
/* -------------------------------------------------------------------------- */

export function readStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function writeStoredSession(session: AuthSession | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.session);
  }
}

/**
 * Called when a 401 survives the refresh attempt. `AuthContext` registers a
 * handler so the app can clear its state and route to /login without this
 * module importing React.
 */
let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

/* -------------------------------------------------------------------------- */
/* Request interceptor — attach the bearer token                               */
/* -------------------------------------------------------------------------- */

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const session = readStoredSession();
  if (session?.token) {
    config.headers.set('Authorization', `Bearer ${session.token}`);
  }
  return config;
});

/* -------------------------------------------------------------------------- */
/* Response interceptor — refresh once, then normalise every failure           */
/* -------------------------------------------------------------------------- */

/** Friendly copy per status. Raw Axios messages never reach the UI. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'That request could not be processed. Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  409: 'That time slot has just been taken. Please pick another one.',
  422: 'Some of the details need fixing before we can save this.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong. Please try again.',
  502: 'Something went wrong. Please try again.',
  503: 'The service is temporarily unavailable. Please try again shortly.',
};

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';
const OFFLINE_MESSAGE = 'We could not reach the server. Check your connection and try again.';

interface ServerErrorBody {
  message?: string;
  title?: string;
  code?: string;
  /** ASP.NET Core `ValidationProblemDetails` shape. */
  errors?: Record<string, string[] | string>;
}

/** Turns any thrown value into the single `ApiError` shape the UI understands. */
export function normaliseError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ServerErrorBody>;

    if (!axiosError.response) {
      return {
        status: 0,
        message: axiosError.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : OFFLINE_MESSAGE,
        code: axiosError.code,
      };
    }

    const { status, data } = axiosError.response;
    const fieldErrors = data?.errors
      ? Object.fromEntries(
          Object.entries(data.errors).map(([field, messages]) => [
            // ASP.NET Core sends PascalCase keys; forms use camelCase.
            field.charAt(0).toLowerCase() + field.slice(1),
            Array.isArray(messages) ? messages[0] : String(messages),
          ]),
        )
      : undefined;

    return {
      status,
      // A 422 carries actionable server copy; anything else uses our own wording
      // so internal details never leak to the user.
      message: status === 422 && data?.message ? data.message : STATUS_MESSAGES[status] ?? GENERIC_MESSAGE,
      fieldErrors,
      code: data?.code,
    };
  }

  return { status: 0, message: GENERIC_MESSAGE };
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'message' in value &&
    typeof (value as ApiError).message === 'string'
  );
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshInFlight: Promise<AuthSession | null> | null = null;

async function refreshSession(): Promise<AuthSession | null> {
  const session = readStoredSession();
  if (!session?.refreshToken) return null;

  try {
    const { data } = await axios.post<AuthSession>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken: session.refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    writeStoredSession(data);
    return data;
  } catch {
    writeStoredSession(null);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isRefreshCall = config?.url?.includes('/auth/refresh');

    if (status === 401 && config && !config._retried && !isRefreshCall) {
      config._retried = true;

      // Collapse parallel 401s into a single refresh round-trip.
      refreshInFlight ??= refreshSession().finally(() => {
        refreshInFlight = null;
      });
      const session = await refreshInFlight;

      if (session?.token) {
        config.headers.set('Authorization', `Bearer ${session.token}`);
        return apiClient(config);
      }

      unauthorizedHandler?.();
    }

    if (status === 401 && isRefreshCall) {
      unauthorizedHandler?.();
    }

    return Promise.reject(normaliseError(error));
  },
);

/** Thin helpers so the repositories stay free of Axios response plumbing. */
export const http = {
  get: async <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
    (await apiClient.get<T>(url, { params })).data,
  post: async <T>(url: string, body?: unknown): Promise<T> => (await apiClient.post<T>(url, body)).data,
  put: async <T>(url: string, body?: unknown): Promise<T> => (await apiClient.put<T>(url, body)).data,
  patch: async <T>(url: string, body?: unknown): Promise<T> => (await apiClient.patch<T>(url, body)).data,
  delete: async (url: string): Promise<void> => {
    await apiClient.delete(url);
  },
};
