import { useEffect, useState } from 'react';
import { useMemoized } from './memo';

const fetch = global.fetch;

export interface FetchValues<T> {
  response?: T;
  loading: boolean;
  error?: Error;
}

export interface FetchOptions {
  pause?: boolean;
}

/**
 * Fetch JSON data if any of the input values change. The response from previous
 * fetches is retained while a new request is in-flight.
 */
export function useFetch<T>(
  input: RequestInfo,
  init?: RequestInit,
  options?: FetchOptions
): FetchValues<T> {
  // Memoize options so consumers don't have to
  const fetchOptions = useMemoized(
    () => ({
      pause: options?.pause ?? false,
    }),
    [options?.pause]
  );

  const [fetchState, setFetchState] = useState<FetchValues<T>>({
    response: undefined,
    loading: fetchOptions.pause === false,
    error: undefined,
  });

  useEffect(() => {
    const abortController = new AbortController();

    async function performFetch() {
      let response: T | undefined = undefined;
      let error: Error | undefined = undefined;

      try {
        const requestInit = { ...init, signal: abortController.signal };
        const res = await fetch(input, requestInit);
        response = (await res.json()) as T;
      } catch (e) {
        error = e;
      } finally {
        // Only do the side-effect to set state if we haven't been aborted
        if (abortController.signal.aborted) return;
        setFetchState({ response, loading: false, error });
      }
    }

    if (fetchOptions.pause === true) {
      return;
    }

    setFetchState((current) => ({
      response: current.response,
      loading: true,
      error: undefined,
    }));
    performFetch();

    // Abort any in-flight requests and reset the loading state if hook inputs change and on unmount
    return () => {
      abortController.abort();
      setFetchState((current) => ({
        response: current.response,
        loading: false,
        error: current.error,
      }));
    };
  }, [input, init, fetchOptions]);

  return fetchState;
}
