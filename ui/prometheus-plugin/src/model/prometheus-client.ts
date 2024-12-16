// Copyright 2023 The Perses Authors
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

import { fetch, fetchJson, RequestHeaders } from '@perses-dev/core';
import { DatasourceClient } from '@perses-dev/plugin-system';
import {
  InstantQueryRequestParameters,
  InstantQueryResponse,
  LabelNamesRequestParameters,
  LabelNamesResponse,
  LabelValuesRequestParameters,
  LabelValuesResponse,
  MetricMetadataRequestParameters,
  MetricMetadataResponse,
  ParseQueryRequestParameters,
  ParseQueryResponse,
  RangeQueryRequestParameters,
  RangeQueryResponse,
  SeriesRequestParameters,
  SeriesResponse,
  SuccessResponse,
} from './api-types';

interface PrometheusClientOptions {
  datasourceUrl: string;
  headers?: RequestHeaders;
}

export interface PrometheusClient extends DatasourceClient {
  options: PrometheusClientOptions;
  instantQuery(params: InstantQueryRequestParameters, headers?: RequestHeaders): Promise<InstantQueryResponse>;
  rangeQuery(params: RangeQueryRequestParameters, headers?: RequestHeaders): Promise<RangeQueryResponse>;
  labelNames(params: LabelNamesRequestParameters, headers?: RequestHeaders): Promise<LabelNamesResponse>;
  labelValues(params: LabelValuesRequestParameters, headers?: RequestHeaders): Promise<LabelValuesResponse>;
  metricMetadata(params: MetricMetadataRequestParameters, headers?: RequestHeaders): Promise<MetricMetadataResponse>;
  series(params: SeriesRequestParameters, headers?: RequestHeaders): Promise<SeriesResponse>;
  parseQuery(params: ParseQueryRequestParameters, headers?: RequestHeaders): Promise<ParseQueryResponse>;
}

export interface QueryOptions {
  datasourceUrl: string;
  headers?: RequestHeaders;
}

/**
 * Calls the `/-/healthy` endpoint to check if the datasource is healthy.
 */
export function healthCheck(queryOptions: QueryOptions) {
  return async (): Promise<boolean> => {
    const url = `${queryOptions.datasourceUrl}/-/healthy`;

    try {
      const resp = await fetch(url, { headers: queryOptions.headers });
      return resp.status === 200;
    } catch {
      return false;
    }
  };
}

/**
 * Calls the `/api/v1/query` endpoint to get metrics data.
 */
export function instantQuery(
  params: InstantQueryRequestParameters,
  queryOptions: QueryOptions
): Promise<InstantQueryResponse> {
  return fetchWithPost<InstantQueryRequestParameters, InstantQueryResponse>('/api/v1/query', params, queryOptions);
}

/**
 * Calls the `/api/v1/query_range` endpoint to get metrics data.
 */
export function rangeQuery(
  params: RangeQueryRequestParameters,
  queryOptions: QueryOptions
): Promise<RangeQueryResponse> {
  return fetchWithPost<RangeQueryRequestParameters, RangeQueryResponse>('/api/v1/query_range', params, queryOptions);
}

/**
 * Calls the `/api/v1/labels` endpoint to get a list of label names.
 */
export function labelNames(
  params: LabelNamesRequestParameters,
  queryOptions: QueryOptions
): Promise<LabelNamesResponse> {
  return fetchWithPost<LabelNamesRequestParameters, LabelNamesResponse>('/api/v1/labels', params, queryOptions);
}

/**
 * Calls the `/api/v1/label/{labelName}/values` endpoint to get a list of values for a label.
 */
export function labelValues(
  params: LabelValuesRequestParameters,
  queryOptions: QueryOptions
): Promise<LabelValuesResponse> {
  const { labelName, ...searchParams } = params;

  // In case label name is empty, we'll receive a 404, so we can replace it by an empty list, which is less confusing.
  // Note that an empty list is the prometheus result if the label does not exist.
  if (labelName.length === 0) {
    return new Promise((resolve) => {
      resolve({ data: [] as string[] } as SuccessResponse<string[]>);
    });
  }

  const apiURI = `/api/v1/label/${encodeURIComponent(labelName)}/values`;
  return fetchWithGet<typeof searchParams, LabelValuesResponse>(apiURI, searchParams, queryOptions);
}

/**
 * Calls the `/api/v1/label/{labelName}/values` endpoint to get a list of values for a label.
 */
export function metricMetadata(
  params: MetricMetadataRequestParameters,
  queryOptions: QueryOptions
): Promise<MetricMetadataResponse> {
  const apiURI = `/api/v1/metadata`;
  return fetchWithGet<MetricMetadataRequestParameters, MetricMetadataResponse>(apiURI, params, queryOptions);
}

/**
 * Calls the `/api/v1/series` endpoint to finding series by label matchers.
 */
export function series(params: SeriesRequestParameters, queryOptions: QueryOptions): Promise<SeriesResponse> {
  const apiURI = `/api/v1/series`;
  return fetchWithPost<SeriesRequestParameters, SeriesResponse>(apiURI, params, queryOptions);
}

/**
 * Calls the `/api/v1/parse_query` to parse the given promQL expresion into an abstract syntax tree (AST).
 */
export function parseQuery(
  params: ParseQueryRequestParameters,
  queryOptions: QueryOptions
): Promise<ParseQueryResponse> {
  const apiURI = `/api/v1/parse_query`;
  return fetchWithPost<ParseQueryRequestParameters, ParseQueryResponse>(apiURI, params, queryOptions);
}

function fetchWithGet<T extends RequestParams<T>, TResponse>(
  apiURI: string,
  params: T,
  queryOptions: QueryOptions
): Promise<TResponse> {
  const { datasourceUrl, headers } = queryOptions;

  let url = `${datasourceUrl}${apiURI}`;
  const urlParams = createSearchParams(params).toString();
  if (urlParams !== '') {
    url += `?${urlParams}`;
  }
  return fetchJson<TResponse>(url, { method: 'GET', headers });
}

function fetchWithPost<T extends RequestParams<T>, TResponse>(
  apiURI: string,
  params: T,
  queryOptions: QueryOptions
): Promise<TResponse> {
  const { datasourceUrl, headers } = queryOptions;

  const url = `${datasourceUrl}${apiURI}`;
  const init = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: createSearchParams(params),
  };
  return fetchResults<TResponse>(url, init);
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
function createSearchParams<T extends RequestParams<T>>(params: T): URLSearchParams {
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

/**
 * Fetch JSON and parse warnings for query inspector
 */
export async function fetchResults<T>(...args: Parameters<typeof global.fetch>): Promise<T> {
  const response = await fetch(...args);
  const json: T = await response.json();
  return { ...json, rawResponse: response };
}
