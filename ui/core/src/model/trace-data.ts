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

/**
 * Common types
 */
export interface TraceAttribute {
  key: string;
  value: TraceAttributeValue;
}

export type TraceAttributeValue =
  | { stringValue: string }
  | { intValue: string }
  | { boolValue: boolean }
  | { arrayValue: { values: TraceAttributeValue[] } };

/**
 * An entire trace
 */
export interface Trace {
  rootSpan: Span;
}

export interface TraceResource {
  serviceName: string;
  attributes: TraceAttribute[];
}

export interface TraceScope {
  name: string;
}

export interface Span {
  resource: TraceResource;
  scope: TraceScope;
  parentSpan?: Span;
  /** child spans, sorted by startTime */
  childSpans: Span[];

  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTimeUnixMs: number;
  endTimeUnixMs: number;
  attributes: TraceAttribute[];
  events: SpanEvent[];
  status?: SpanStatus;
}

export interface SpanEvent {
  timeUnixMs: number;
  name: string;
  attributes: TraceAttribute[];
}

export interface SpanStatus {
  code?: typeof SpanStatusUnset | typeof SpanStatusOk | typeof SpanStatusError;
  message?: string;
}

export const SpanStatusUnset = 'STATUS_CODE_UNSET';
export const SpanStatusOk = 'STATUS_CODE_OK';
export const SpanStatusError = 'STATUS_CODE_ERROR';

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
  trace?: Trace;
  searchResult?: TraceSearchResult[];

  metadata?: TraceMetaData;
}

export interface TraceMetaData {
  executedQueryString?: string;
}

export function isValidTraceId(traceId: string): boolean {
  return /^[a-z0-9]+$/.test(traceId);
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * Assign a color based on the serviceName.
 * The same serviceName should always get the same color assigned.
 */
export function traceServiceColor(serviceName: string, colors: string[]): string {
  if (colors.length === 0) {
    throw new Error('List of colors is empty.');
  }

  const hash = Math.abs(hashCode(serviceName));
  return colors[hash % colors.length] as string;
}
