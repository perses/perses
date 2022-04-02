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
import { buildDatasourceURL, DatasourceSelector, fetchJson } from '@perses-dev/core';
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
import { useGetPrometheusConfig } from './datasource';

export type QueryOptions = Pick<UseQueryOptions, 'enabled'> & {
  datasource?: DatasourceSelector;
};

/**
 * Calls the `/api/v1/query` endpoint to get metrics data.
 */
export function useInstantQuery(params: InstantQueryRequestParameters, queryOptions?: QueryOptions) {
  return useQueryWithPost<InstantQueryRequestParameters, InstantQueryResponse>('/api/v1/query', params, queryOptions);
}

/**
 * Calls the `/api/v1/query_range` endpoint to get metrics data.
 */
export function useRangeQuery(params: RangeQueryRequestParameters, queryOptions?: QueryOptions) {
  return useQueryWithPost<RangeQueryRequestParameters, RangeQueryResponse>('/api/v1/query_range', params, queryOptions);
}

/**
 * Calls the `/api/v1/labels` endpoint to get a list of label names.
 */
export function useLabelNames(params: LabelNamesRequestParameters, queryOptions?: QueryOptions) {
  return useQueryWithPost<LabelNamesRequestParameters, LabelNamesResponse>('/api/v1/labels', params, queryOptions);
}

/**
 * Calls the `/api/v1/label/{labelName}/values` endpoint to get a list of
 * values for a label.
 */
export function useLabelValues(params: LabelValuesRequestParameters, queryOptions?: QueryOptions) {
  const { labelName, ...searchParams } = params;
  const apiURI = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  return useQueryWithGet<typeof searchParams, LabelValuesResponse>(apiURI, searchParams, queryOptions);
}

function useQueryWithGet<T extends RequestParams<T>, TResponse>(
  apiURI: string,
  params: T,
  queryOptions?: QueryOptions
) {
  const getPrometheusDatasource = useGetPrometheusConfig();
  const key = [queryOptions?.datasource?.$ref, apiURI, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    async () => {
      const config = await getPrometheusDatasource(queryOptions?.datasource);
      const datasourceURL = buildDatasourceURL(config.metadata.name, config.spec.http);
      let url = `${datasourceURL}${apiURI}`;

      const urlParams = createSearchParams(params).toString();
      if (urlParams !== '') {
        url += `?${urlParams}`;
      }

      const data = await fetchJson<TResponse>(url, { method: 'GET' });
      return data;
    },
    queryOptions
  );
}

function useQueryWithPost<T extends RequestParams<T>, TResponse>(
  apiURI: string,
  params: T,
  queryOptions?: QueryOptions
) {
  const getPrometheusDatasource = useGetPrometheusConfig();
  const key = [queryOptions?.datasource?.$ref, apiURI, params] as const;

  return useQuery<TResponse, Error, TResponse, typeof key>(
    key,
    async () => {
      const config = await getPrometheusDatasource(queryOptions?.datasource);
      const datasourceURL = buildDatasourceURL(config.metadata.name, config.spec.http);

      const url = `${datasourceURL}${apiURI}`;
      const init = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: createSearchParams(params),
      };
      const data = await fetchJson<TResponse>(url, init);
      return data;
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

/**
 * Creates URLSearchParams from a request params object.
 */
function createSearchParams<T extends RequestParams<T>>(params: T) {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value: ParamValue = params[key];
    if (value === undefined) continue;

    if (typeof value === 'string') {
      searchParams.append(key, value);
      continue;
    }

    if (typeof value === 'number') {
      searchParams.append(key, value.toString());
      continue;
    }

    for (const val of value) {
      searchParams.append(key, val);
    }
  }
  return searchParams;
}
