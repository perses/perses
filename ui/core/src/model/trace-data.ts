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

import { TracesData } from './otlp/trace/v1/trace';

/**
 * Partial trace information returned by search endpoint
 */
export interface TraceSearchResult {
  traceId: string;
  rootServiceName: string;
  rootTraceName: string;
  startTimeUnixMs: number;
  durationMs: number;
  serviceStats: Record<string, ServiceStats>;
}

export interface ServiceStats {
  spanCount: number;
  /** number of spans with errors, unset if zero */
  errorCount?: number;
}

/**
 * A generalized data-model that will be used by Panel components
 * to display traces.
 *
 * If the query contains a valid trace ID, the 'trace' attribute will contain the entire trace.
 * If the query contains a TraceQL query, the 'searchResult' attribute will contain the search results.
 */
export interface TraceData {
  trace?: TracesData;
  searchResult?: TraceSearchResult[];

  metadata?: TraceMetaData;
}

export interface TraceMetaData {
  executedQueryString?: string;
}

export function isValidTraceId(traceId: string): boolean {
  return /^[0-9a-fA-F]+$/.test(traceId);
}
