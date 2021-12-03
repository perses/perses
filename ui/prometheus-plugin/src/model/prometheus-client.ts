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
import { buildDatasourceURL, DatasourceSelector, fetchJson } from '@perses-ui/core';
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
import { PrometheusSpecDatasource, usePrometheusConfig } from './datasource';

export type QueryOptions = Pick<UseQueryOptions, 'enabled'>;

/**
 * Calls the `/api/v1/query` endpoint to get metrics data.
 */
export function useInstantQuery(
  datasource: DatasourceSelector,
  params: InstantQueryRequestParameters,
  queryOptions?: QueryOptions
) {
  return useQueryWithPost<InstantQueryRequestParameters, InstantQueryResponse>(
    datasource,
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
  datasource: DatasourceSelector,
  params: RangeQueryRequestParameters,
  queryOptions?: QueryOptions
) {
  return useQueryWithPost<RangeQueryRequestParameters, RangeQueryResponse>(
    datasource,
    '/api/v1/query_range',
    params,
    undefined,
    queryOptions
  );
}

/**
 * Calls the `/api/v1/labels` endpoint to get a list of label names.
 */
export function useLabelNames(
  datasource: DatasourceSelector,
  params: LabelNamesRequestParameters,
  queryOptions?: QueryOptions
) {
  return useQueryWithPost<LabelNamesRequestParameters, LabelNamesResponse>(
    datasource,
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
  datasource: DatasourceSelector,
  params: LabelValuesRequestParameters,
  queryOptions?: QueryOptions
) {
  const { labelName, ...searchParams } = params;
  const apiURI = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  return useQueryWithGet<typeof searchParams, LabelValuesResponse>(
    datasource,
    apiURI,
    searchParams,
    { match: 'match[]' },
    queryOptions
  );
}

function useQueryWithGet<T extends RequestParams<T>, TResponse>(
  datasourceSelector: DatasourceSelector,
  apiURI: string,
  params: T,
  rename?: KeyNameMap<T>,
  queryOptions?: QueryOptions
) {
  const httpConfig = (<PrometheusSpecDatasource>usePrometheusConfig(datasourceSelector)).http;
  const datasourceURL = buildDatasourceURL(datasourceSelector.name, httpConfig);
  const key = [datasourceURL, apiURI, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    () => {
      let url = `${datasourceURL}${apiURI}`;

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
  datasourceSelector: DatasourceSelector,
  apiURI: string,
  params: T,
  rename?: KeyNameMap<T>,
  queryOptions?: QueryOptions
) {
  const httpConfig = (<PrometheusSpecDatasource>usePrometheusConfig(datasourceSelector)).http;
  const datasourceURL = buildDatasourceURL(datasourceSelector.name, httpConfig);
  const key = [datasourceURL, apiURI, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    () => {
      const url = `${datasourceURL}${apiURI}`;
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
function createSearchParams<T extends RequestParams<T>>(params: T, rename?: KeyNameMap<T>) {
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
