// Copyright 2021 The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useQuery, UseQueryOptions } from 'react-query';
import { ResourceSelector, useDeepMemo, fetchJson } from '@perses-ui/core';
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

export type QueryOptions = Pick<UseQueryOptions, 'enabled'>;

/**
 * Calls the `/api/v1/query` endpoint to get metrics data.
 */
export function useInstantQuery(
  dataSource: ResourceSelector,
  params: InstantQueryRequestParameters,
  queryOptions?: QueryOptions
) {
  return useQueryWithPost<InstantQueryRequestParameters, InstantQueryResponse>(
    dataSource,
    '/api/v1/query',
    params,
    undefined,
    queryOptions
  );
}

/**
 * Calls the `/api/v1/query_range` endpoint to get metrics data.
 */
export function useRangeQuery(
  dataSource: ResourceSelector,
  params: RangeQueryRequestParameters,
  queryOptions?: QueryOptions
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

  return useQueryWithPost<RangeQueryRequestParameters, RangeQueryResponse>(
    dataSource,
    '/api/v1/query_range',
    alignedParams,
    undefined,
    queryOptions
  );
}

/**
 * Calls the `/api/v1/labels` endpoint to get a list of label names.
 */
export function useLabelNames(
  dataSource: ResourceSelector,
  params: LabelNamesRequestParameters,
  queryOptions?: QueryOptions
) {
  return useQueryWithPost<LabelNamesRequestParameters, LabelNamesResponse>(
    dataSource,
    '/api/v1/labels',
    params,
    { match: 'match[]' },
    queryOptions
  );
}

/**
 * Calls the `/api/v1/label/{labelName}/values` endpoint to get a list of
 * values for a label.
 */
export function useLabelValues(
  dataSource: ResourceSelector,
  params: LabelValuesRequestParameters,
  queryOptions?: QueryOptions
) {
  const { labelName, ...searchParams } = params;
  const apiUrl = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  return useQueryWithGet<typeof searchParams, LabelValuesResponse>(
    dataSource,
    apiUrl,
    searchParams,
    { match: 'match[]' },
    queryOptions
  );
}

function useQueryWithGet<T extends RequestParams<T>, TResponse>(
  dataSource: ResourceSelector,
  apiUrl: string,
  params: T,
  rename?: KeyNameMap<T>,
  queryOptions?: QueryOptions
) {
  const { base_url: baseUrl } = usePrometheusConfig(dataSource);
  const key = [baseUrl, apiUrl, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    () => {
      let url = `${baseUrl}${apiUrl}`;

      const urlParams = createSearchParams(params, rename).toString();
      if (urlParams !== '') {
        url += `?${urlParams}`;
      }

      return fetchJson<TResponse>(url, { method: 'GET' });
    },
    queryOptions
  );
}

function useQueryWithPost<T extends RequestParams<T>, TResponse>(
  dataSource: ResourceSelector,
  apiUrl: string,
  params: T,
  rename?: KeyNameMap<T>,
  queryOptions?: QueryOptions
) {
  const { base_url: baseUrl } = usePrometheusConfig(dataSource);
  const key = [baseUrl, apiUrl, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    () => {
      const url = `${baseUrl}${apiUrl}`;
      const init = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: createSearchParams(params, rename),
      };
      return fetchJson<TResponse>(url, init);
    },
    queryOptions
  );
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
