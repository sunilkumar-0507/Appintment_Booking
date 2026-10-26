import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApiError } from '@/types';
import { normaliseError } from '@/services';

export interface AsyncState<T> {
  data: T | undefined;
  loading: boolean;
  error: ApiError | undefined;
  /** Re-runs the fetcher, keeping the previous data on screen while it loads. */
  refetch: () => void;
  /** Optimistic local update — used after a mutation succeeds. */
  setData: React.Dispatch<React.SetStateAction<T | undefined>>;
}

/**
 * The single data-fetching primitive in the app. Pages call it with a
 * repository method; loading, error and refetch handling comes for free, and
 * nothing else needs to know whether the data came from mocks or a REST API.
 *
 * Stale responses are dropped, so rapid filter changes can't render out of order.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const { enabled = true } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const [nonce, setNonce] = useState(0);

  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    setLoading(true);
    setError(undefined);

    fetcherRef
      .current()
      .then((result) => {
        if (id !== requestId.current) return; // a newer request won
        setData(result);
        setError(undefined);
      })
      .catch((caught: unknown) => {
        if (id !== requestId.current) return;
        setError(normaliseError(caught));
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });

    return () => {
      // Invalidate this request so a late resolution cannot overwrite newer data.
      if (id === requestId.current) requestId.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, nonce]);

  const refetch = useCallback(() => setNonce((value) => value + 1), []);

  return { data, loading, error, refetch, setData };
}

/**
 * Companion for writes. Tracks in-flight state so submit buttons can disable
 * themselves, and surfaces normalised errors for form field mapping.
 */
export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
): {
  run: (...args: TArgs) => Promise<TResult | undefined>;
  loading: boolean;
  error: ApiError | undefined;
  reset: () => void;
} {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const actionRef = useRef(action);
  actionRef.current = action;

  const run = useCallback(async (...args: TArgs) => {
    setLoading(true);
    setError(undefined);
    try {
      return await actionRef.current(...args);
    } catch (caught) {
      const normalised = normaliseError(caught);
      if (mounted.current) setError(normalised);
      throw normalised;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const reset = useCallback(() => setError(undefined), []);

  return { run, loading, error, reset };
}
