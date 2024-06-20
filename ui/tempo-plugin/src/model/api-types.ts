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
export interface Attribute {
  key: string;
  value: AttributeValue;
}

export type AttributeValue =
  | { stringValue: string }
  | { intValue: string }
  | { boolValue: boolean }
  | { arrayValue: { values: AttributeValue[] } };

/**
 * Response of Tempo HTTP API endpoint GET /api/search/<query>
 */
export interface SearchTraceQueryResponse {
  traces: TraceSearchResult[];
}

export interface TraceSearchResult {
  traceID: string;
  rootServiceName: string;
  rootTraceName: string;
  startTimeUnixNano: string;
  /** unset if duration is less than 1ms */
  durationMs?: number;
  /** @deprecated spanSet is deprecated in favor of spanSets */
  spanSet?: {
    spans: SpanSearchResult[];
    matched: number;
  };
  spanSets?: Array<{
    spans: SpanSearchResult[];
    matched: number;
  }>;
  /** ServiceStats are only available in Tempo vParquet4+ blocks */
  serviceStats?: Record<string, ServiceStats>;
}

export interface SpanSearchResult {
  spanID: string;
  name: string;
  startTimeUnixNano: string;
  durationNanos: string;
  attributes: Attribute[];
}

export interface ServiceStats {
  spanCount: number;
  /** number of spans with errors, unset if zero */
  errorCount?: number;
}

/**
 * Response of Tempo HTTP API endpoint GET /api/traces/<traceID>
 * OTEL trace proto: https://github.com/open-telemetry/opentelemetry-proto-go/blob/main/otlp/trace/v1/trace.pb.go
 */
export interface SearchTraceIDResponse {
  batches: Batch[];
}

export interface Batch {
  resource: Resource;
  scopeSpans: ScopeSpan[];
}

export interface Resource {
  attributes: Attribute[];
}

export interface ScopeSpan {
  scope: Scope;
  spans: Span[];
}

export interface Scope {
  name: string;
}

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: Attribute[];
  events?: SpanEvent[];
  status?: SpanStatus;
}

export interface SpanEvent {
  timeUnixNano: string;
  name: string;
  attributes?: Attribute[];
}

export interface SpanStatus {
  code?: typeof SpanStatusUnset | typeof SpanStatusOk | typeof SpanStatusError;
  message?: string;
}

export const SpanStatusUnset = 'STATUS_CODE_UNSET';
export const SpanStatusOk = 'STATUS_CODE_OK';
export const SpanStatusError = 'STATUS_CODE_ERROR';
