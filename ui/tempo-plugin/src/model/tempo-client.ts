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

import { fetch, RequestHeaders } from '@perses-dev/core';
import { DatasourceClient } from '@perses-dev/plugin-system';
import { SearchTraceIDResponse, SearchTraceQueryResponse, ServiceStats } from './api-types';

interface TempoClientOptions {
  datasourceUrl: string;
  headers?: RequestHeaders;
}

export interface TempoClient extends DatasourceClient {
  options: TempoClientOptions;
  searchTraceQuery(query: string, datasourceUrl: string): Promise<SearchTraceQueryResponse>;
  searchTraceQueryFallback(query: string, datasourceUrl: string): Promise<SearchTraceQueryResponse>;
  searchTraceID(traceID: string, datasourceUrl: string): Promise<SearchTraceIDResponse>;
}

export const executeRequest = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  const jsonData = await response.json();
  return jsonData;
};

function fetchWithGet<TResponse>(apiURI: string, datasourceUrl: string) {
  const url = `${datasourceUrl}${apiURI}`;
  return executeRequest<TResponse>(url);
}

/**
 * Returns a summary report of traces that satisfy the query.
 */
export function searchTraceQuery(query: string, datasourceUrl: string) {
  return fetchWithGet<SearchTraceQueryResponse>(`/api/search?q=${query}`, datasourceUrl);
}

/**
 * Returns a detailed report, including all the spans, for a given trace.
 */
export function searchTraceID(traceID: string, datasourceUrl: string) {
  return fetchWithGet<SearchTraceIDResponse>(`/api/traces/${traceID}`, datasourceUrl);
}

/**
 * Returns a summary report of traces that satisfy the query.
 *
 * If the serviceStats field is missing in the response, fetches all traces
 * and calculates the serviceStats.
 *
 * Tempo computes the serviceStats field during ingestion since vParquet4,
 * this fallback is required for older block formats.
 */
export async function searchTraceQueryFallback(
  query: string,
  datasourceUrl: string
): Promise<SearchTraceQueryResponse> {
  // Get a list of traces that satisfy the query.
  const searchResponse = await searchTraceQuery(query, datasourceUrl);
  if (!searchResponse.traces || searchResponse.traces.length === 0) {
    return { traces: [] };
  }

  // exit early if fallback is not required (serviceStats are contained in the response)
  if (searchResponse.traces[0]?.serviceStats) {
    return searchResponse;
  }

  // calculate serviceStats (number of spans and errors) per service
  return {
    traces: await Promise.all(
      searchResponse.traces.map(async (trace) => {
        const serviceStats: Record<string, ServiceStats> = {};
        const searchTraceIDResponse = await searchTraceID(trace.traceID, datasourceUrl);

        // For every trace, get the full trace, and find the number of spans and errors.
        for (const batch of searchTraceIDResponse.batches) {
          let serviceName = '?';
          for (const attr of batch.resource.attributes) {
            if (attr.key === 'service.name' && 'stringValue' in attr.value) {
              serviceName = attr.value.stringValue;
              break;
            }
          }

          const stats = serviceStats[serviceName] ?? { spanCount: 0 };
          for (const scopeSpan of batch.scopeSpans) {
            stats.spanCount += scopeSpan.spans.length;
            for (const span of scopeSpan.spans) {
              if (span.status?.code) {
                stats.errorCount = (stats.errorCount ?? 0) + 1;
              }
            }
          }
          serviceStats[serviceName] = stats;
        }

        return {
          ...trace,
          serviceStats,
        };
      })
    ),
  };
}
