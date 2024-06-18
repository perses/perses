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

import { UnknownSpec, QueryDefinition, traceServiceColor } from '@perses-dev/core';
import * as api from './traceResponse';
import { Resource, Span } from './GanttChart/model';

export type TraceQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TraceQuery', PluginSpec>;

/**
 * The Options object type supported by the GanttChart panel plugin.
 */
export interface GanttChartOptions {
  traceID?: string;
}

/**
 * Creates the initial/empty options for a GanttChart panel.
 */
export function createInitialGanttChartOptions() {
  return {};
}

/**
 * parseResource parses the Resource API type and assigns a color
 */
function parseResource(resource: api.Resource, colors: string[]): Resource {
  let serviceName = '?';
  for (const attr of resource.attributes) {
    if (attr.key === 'service.name' && 'stringValue' in attr.value) {
      serviceName = attr.value.stringValue;
      break;
    }
  }

  return {
    serviceName,
    color: traceServiceColor(serviceName, colors),
    attributes: resource.attributes,
  };
}

/**
 * parseSpan parses the Span API type to the internal representation
 * i.e. convert strings to numbers etc.
 */
function parseSpan(span: api.Span) {
  return {
    spanId: span.spanId,
    parentSpanId: span.parentSpanId,
    spanName: span.name,
    startTimeUnixNano: parseInt(span.startTimeUnixNano),
    endTimeUnixNano: parseInt(span.endTimeUnixNano),
    attributes: span.attributes,
  };
}

/**
 * buildTree builds a tree of spans from the Tempo API response
 * time complexity: O(3n)
 */
export function buildTree(trace: api.TraceResponse, colors: string[]): Span | null {
  // first pass: build lookup table <spanId, Span>
  const lookup: Map<string, Span> = new Map();
  for (const batch of trace.batches) {
    const resource = parseResource(batch.resource, colors);

    for (const scopeSpan of batch.scopeSpans) {
      for (const span of scopeSpan.spans) {
        const node: Span = {
          ...parseSpan(span),
          resource,
          children: [],
        };
        lookup.set(span.spanId, node);
      }
    }
  }

  // second pass: build tree based on parentSpanId property
  let root: Span | null = null;
  for (const [, span] of lookup) {
    if (!span.parentSpanId) {
      root = span;
    } else {
      const parent = lookup.get(span.parentSpanId);
      if (!parent) {
        throw new Error(`span ${span.spanId} has parent ${span.parentSpanId} which does not exist`);
      }

      span.parent = parent;
      parent.children.push(span);
    }
  }

  // third pass: sort child spans by start time
  for (const [, span] of lookup) {
    span.children.sort((a: Span, b: Span) => a.startTimeUnixNano - b.startTimeUnixNano);
  }

  return root;
}
