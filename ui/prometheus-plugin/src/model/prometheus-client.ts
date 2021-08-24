import {
  FetchOptions,
  ResourceSelector,
  useDeepMemo,
  useFetch,
} from '@perses-ui/core';
import {
  InstantQueryRequestParameters,
  InstantQueryResponse,
  LabelNamesRequestParameters,
  LabelNamesResponse,
  LabelValuesRequestParameters,
  LabelValuesResponse,
  RangeQueryRequestParameters,
  RangeQueryResponse,
} from './api-types';
import { usePrometheusConfig } from './datasource';

/**
 * Calls the `/api/v1/query` endpoint to get metrics data.
 */
export function useInstantQuery(
  dataSource: ResourceSelector,
  params: InstantQueryRequestParameters,
  fetchOptions?: FetchOptions
) {
  const { url, init } = usePost(dataSource, '/api/v1/query', params);
  return useFetch<InstantQueryResponse>(url, init, fetchOptions);
}

/**
 * Calls the `/api/v1/query_range` endpoint to get metrics data.
 */
export function useRangeQuery(
  dataSource: ResourceSelector,
  params: RangeQueryRequestParameters,
  fetchOptions?: FetchOptions
) {
  // Align the time range so that it's a multiple of the step
  const alignedParams = useDeepMemo(() => {
    const { start, end, step } = params;
    const utcOffsetSec = new Date().getTimezoneOffset() * 60;

    const alignedEnd =
      Math.floor((end + utcOffsetSec) / step) * step - utcOffsetSec;
    const alignedStart =
      Math.floor((start + utcOffsetSec) / step) * step - utcOffsetSec;

    return {
      ...params,
      start: alignedStart,
      end: alignedEnd,
    };
  }, [params]);

  const { url, init } = usePost(
    dataSource,
    '/api/v1/query_range',
    alignedParams
  );
  return useFetch<RangeQueryResponse>(url, init, fetchOptions);
}

/**
 * Calls the `/api/v1/labels` endpoint to get a list of label names.
 */
export function useLabelNames(
  dataSource: ResourceSelector,
  params: LabelNamesRequestParameters,
  fetchOptions?: FetchOptions
) {
  const { url, init } = usePost(dataSource, '/api/v1/labels', params, {
    match: 'match[]',
  });
  return useFetch<LabelNamesResponse>(url, init, fetchOptions);
}

/**
 * Calls the `/api/v1/label/{labelName}/values` endpoint to get a list of
 * values for a label.
 */
export function useLabelValues(
  dataSource: ResourceSelector,
  params: LabelValuesRequestParameters,
  fetchOptions?: FetchOptions
) {
  const { labelName, ...searchParams } = params;
  const apiUrl = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  const { url, init } = useGet(dataSource, apiUrl, searchParams, {
    match: 'match[]',
  });
  return useFetch<LabelValuesResponse>(url, init, fetchOptions);
}

function useGet<T extends RequestParams<T>>(
  dataSource: ResourceSelector,
  apiUrl: string,
  params: T,
  rename?: KeyNameMap<T>
) {
  const { base_url: baseUrl } = usePrometheusConfig(dataSource);
  return useDeepMemo(() => {
    let url = `${baseUrl}${apiUrl}`;

    const urlParams = createSearchParams(params, rename).toString();
    if (urlParams !== '') {
      url += `?${urlParams}`;
    }

    return { url, init: { method: 'GET' } };
  }, [baseUrl, apiUrl, params, rename]);
}

function usePost<T extends RequestParams<T>>(
  dataSource: ResourceSelector,
  apiUrl: string,
  params: T,
  rename?: KeyNameMap<T>
) {
  const { base_url: baseUrl } = usePrometheusConfig(dataSource);
  return useDeepMemo(() => {
    return {
      url: `${baseUrl}${apiUrl}`,
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: createSearchParams<T>(params, rename),
      },
    };
  }, [baseUrl, apiUrl, params, rename]);
}

// Request parameter values we know how to serialize
type ParamValue = string | string[] | number | undefined;

// Used to constrain the types that can be passed to createSearchParams to
// just the ones we know how to serialize
type RequestParams<T> = {
  [K in keyof T]: ParamValue;
};

// Allow keys in params to be renamed when mapping to URL
type KeyNameMap<T> = {
  [K in keyof T]?: string | undefined;
};

/**
 * Creates URLSearchParams from a request params object.
 */
function createSearchParams<T extends RequestParams<T>>(
  params: T,
  rename?: KeyNameMap<T>
) {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value: ParamValue = params[key];
    if (value === undefined) continue;

    // Allow keys to be renamed when mapping to parameters
    const renamed: string | undefined = rename?.[key];
    const name: string = renamed !== undefined ? renamed : key;

    if (typeof value === 'string') {
      searchParams.append(name, value);
      continue;
    }

    if (typeof value === 'number') {
      searchParams.append(name, value.toString());
      continue;
    }

    for (const val of value) {
      searchParams.append(name, val);
    }
  }
  return searchParams;
}
