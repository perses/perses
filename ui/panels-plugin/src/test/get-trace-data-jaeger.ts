// Copyright 2024 The Perses Authors
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

import { Span, SpanEvent, Trace, TraceAttribute, TraceAttributeValue, TraceResource } from '@perses-dev/core';

// the following jaeger data types and parsing function should eventually be moved to a jaeger plugin

export interface JaegerTrace {
  traceID: string;
  spans: JaegerSpan[];
  processes: unknown;
  warnings: unknown;
}

export interface JaegerSpan {
  traceID: string;
  spanID: string;
  hasChildren: boolean;
  childSpanIds: string[];
  depth: number;
  processID: string;
  process: JaegerProcess;

  operationName: string;
  /** start time in microseconds */
  startTime: number;
  relativeStartTime: number;
  duration: number;
  tags: JaegerTag[];
  references: unknown;
  logs: unknown;
  warnings: unknown;
}

interface JaegerProcess {
  serviceName: string;
  tags: JaegerTag[];
}

type JaegerTag =
  | {
      type: 'string';
      key: string;
      value: string;
    }
  | {
      type: 'int64';
      key: string;
      value: number;
    };

function parseTag(tags: JaegerTag): TraceAttribute {
  let value: TraceAttributeValue;
  switch (tags.type) {
    case 'string':
      value = { stringValue: tags.value };
      break;
    case 'int64':
      value = { intValue: tags.value.toString() };
      break;
    default:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error(`unknown jaeger tag type ${(tags as any).type}`);
  }
  return { key: tags.key, value };
}

function parseProcess(process: JaegerProcess): TraceResource {
  return {
    serviceName: process.serviceName,
    attributes: process.tags.map(parseTag),
  };
}

function parseSpan(span: JaegerSpan): {
  traceId: string;
  spanId: string;
  name: string;
  kind: string;
  startTimeUnixMs: number;
  endTimeUnixMs: number;
  attributes: TraceAttribute[];
  events: SpanEvent[];
  status: Record<string, unknown>;
} {
  return {
    traceId: span.traceID,
    spanId: span.spanID,
    name: span.operationName,
    kind: '',
    startTimeUnixMs: span.startTime / 1000,
    endTimeUnixMs: (span.startTime + span.duration) / 1000,
    attributes: span.tags.map(parseTag),
    events: [],
    status: {},
  };
}

export function parseJaegerTrace(jaegerTrace: JaegerTrace): Trace {
  // first pass: build lookup table <spanId, Span>
  const lookup = new Map<string, Span>();
  for (const jaegerSpan of jaegerTrace.spans) {
    const span: Span = {
      resource: parseProcess(jaegerSpan.process),
      scope: {
        name: jaegerSpan.processID,
      },
      childSpans: [],
      ...parseSpan(jaegerSpan),
    };
    lookup.set(jaegerSpan.spanID, span);
  }

  // second pass: build tree based on childSpanIds property
  let rootSpan: Span | null = null;
  for (const jaegerSpan of jaegerTrace.spans) {
    const span = lookup.get(jaegerSpan.spanID);
    if (!span) {
      continue;
    }

    if (jaegerSpan.depth === 0) {
      rootSpan = span;
    }

    const childSpans: Span[] = [];
    for (const childSpanId of jaegerSpan.childSpanIds) {
      const childSpan = lookup.get(childSpanId);
      if (!childSpan) {
        continue;
      }

      childSpan.parentSpan = span;
      childSpan.parentSpanId = span.spanId;
      childSpans.push(childSpan);
    }
    span.childSpans = childSpans.sort((a, b) => a.startTimeUnixMs - b.startTimeUnixMs);
  }

  if (!rootSpan) {
    throw new Error('root span not found');
  }

  return {
    rootSpan,
  };
}
