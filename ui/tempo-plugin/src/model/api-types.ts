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

export interface Span {
  startTimeUnixNano: string;
  spanId?: string; // Span from api/search/<query>
  spanID?: string; // Span from api/traces/<traceID>
  attributes?: Attribute[];
  durationNanos?: string;
  endTimeUnixNano?: string;
  kind?: string;
  name?: string;
  parentSpanId?: string;
  status?: {
    code?: string;
  };
  traceId?: string;
}

export interface Trace {
  traceID: string;
  rootServiceName: string;
  rootTraceName: string;
  startTimeUnixNano: string;
  durationMs: number;
  spanSets?: Array<{
    spans: Span[];
    matched: number;
  }>;
}

/**
 * Response of Tempo HTTP API endpoint GET /api/search/<query>
 */
export interface SearchTraceQueryResponse {
  traces: Trace[];
}

export interface Attribute {
  key: string;
  value: {
    stringValue?: string;
    intValue?: string;
  };
}

export interface ScopeSpan {
  scope: {
    name: string;
  };
  spans: Span[];
}

export interface Batch {
  resource: {
    attributes: Attribute[];
  };
  scopeSpans: ScopeSpan[];
}

/**
 * Response of Tempo HTTP API endpoint GET /api/traces/<traceID>
 */
export interface SearchTraceIDResponse {
  batches: Batch[];
}

/**
 * Combined Response of Tempo HTTP API endpoint GET /api/search/<query>
 * and GET /api/traces/<traceID>. For each trace returned from GET /api/search/<query>
 * a detailed trace report is fetched from  GET /api/traces/<traceID>.
 */
export interface EnrichedTraceQueryResponse {
  query: string;
  traces: Array<{
    spanCount: number;
    errorCount: number;
    summary: Trace;
    traceDetails: SearchTraceIDResponse;
  }>;
}
