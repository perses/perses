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
import { SearchTraceIDResponse, EnrichedTraceQueryResponse, SearchTraceQueryResponse } from './api-types';

interface TempoClientOptions {
  datasourceUrl: string;
  headers?: RequestHeaders;
}

export interface TempoClient extends DatasourceClient {
  options: TempoClientOptions;
  getEnrichedTraceQuery(query: string, datasourceUrl: string): Promise<EnrichedTraceQueryResponse>;
  searchTraceQuery(query: string, datasourceUrl: string): Promise<SearchTraceQueryResponse>;
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
 * Combined response of Tempo HTTP API endpoints GET /api/search/<query>
 * and GET /api/traces/<traceID>. For each trace returned from GET /api/search/<query>
 * a detailed trace report is fetched from  GET /api/traces/<traceID>. This is a
 * temporary workaround to obtain the total number of spans and total number
 * of errors for a trace.
 *
 * TODO: This workaround should be replaced once this issue,
 * https://github.com/grafana/tempo/issues/2940, is resolved upstream in
 * Tempo.
 */
export async function getEnrichedTraceQuery(query: string, datasourceUrl: string): Promise<EnrichedTraceQueryResponse> {
  // Get a list of traces that satisfy the query.
  const searchResponse = await searchTraceQuery(query, datasourceUrl);
  if (!searchResponse.traces) {
    return { query, traces: [] };
  }

  return {
    query,
    traces: await Promise.all(
      searchResponse.traces.map(async (trace) => {
        let spanCount = 0;
        let errorCount = 0;
        const searchTraceIDResponse = await searchTraceID(trace.traceID, datasourceUrl);

        // For every trace, get the full trace, and find the total number of spans and errors.
        for (const batch of searchTraceIDResponse.batches) {
          for (const scopeSpan of batch.scopeSpans) {
            spanCount += scopeSpan.spans.length;
            for (const span of scopeSpan.spans) {
              if (span.status?.code) {
                errorCount++;
              }
            }
          }
        }

        return {
          summary: trace,
          traceDetails: searchTraceIDResponse,
          spanCount,
          errorCount,
        };
      })
    ),
  };
}
