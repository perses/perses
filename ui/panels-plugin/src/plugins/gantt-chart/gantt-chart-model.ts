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

import { UnknownSpec, QueryDefinition } from '@perses-dev/core';
import ColorHash from 'color-hash';
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

const colorHasher = new ColorHash();

/**
 * parseResource parses the Resource API type and assigns a color
 */
function parseResource(resource: api.Resource, colors: string[]): Resource {
  let serviceName = '?';
  for (const attr of resource.attributes) {
    if (attr.key === 'service.name' && attr.value.stringValue) {
      serviceName = attr.value.stringValue;
    }
  }

  // Assign a color based on the serviceName.
  // The same serviceName should always get the same color assigned.
  // TODO: use https://github.com/zenozeng/color-hash/blob/main/lib/sha256.ts directly
  const hash = (colorHasher as unknown as { hash: (s: string) => number }).hash(serviceName);
  const color = colors[hash % colors.length]!;

  return {
    serviceName,
    color,
  };
}

/**
 * parseSpan parses the Span API type to the internal representation
 * i.e. convert strings to numbers etc.
 */
function parseSpan(span: api.Span) {
  return {
    spanId: span.spanId,
    spanName: span.name,
    startTimeUnixNano: parseInt(span.startTimeUnixNano),
    endTimeUnixNano: parseInt(span.endTimeUnixNano),
  };
}

/**
 * buildTree builds a tree of spans from the Tempo API response
 * time complexity: O(n)
 */
function buildTree(trace: api.TraceResponse, colors: string[]): Span | null {
  let root: Span | null = null;
  const lookup: Map<string, Span> = new Map();

  // build tree based on parentSpanId property
  for (const batch of trace.batches) {
    const resource = parseResource(batch.resource, colors);

    for (const scopeSpan of batch.scopeSpans) {
      for (const span of scopeSpan.spans) {
        const node: Span = {
          ...parseSpan(span),
          resource,
          parents: [],
          children: [],
        };
        lookup.set(span.spanId, node);

        if (!span.parentSpanId) {
          root = node;
        } else {
          const parent = lookup.get(span.parentSpanId);
          if (!parent) {
            // TODO: check if this can happen with real world traces
            // in this case, we'll need a second pass.
            throw new Error(`parent not found for ${span.parentSpanId}`);
          }

          node.parents = [...parent.parents, parent];
          parent.children.push(node);
        }
      }
    }
  }

  return root;
}

/**
 * sortChildren recursively sorts the child spans by start time
 * time complexity: O(n)
 */
function sortChildren(node: Span) {
  node.children.sort((a: Span, b: Span) => a.startTimeUnixNano - b.startTimeUnixNano);
  for (const child of node.children) {
    sortChildren(child);
  }
}

/**
 * parseResponse parses the response from Tempo API and builds a tree of spans
 * time complexity: O(2n)
 */
export function parseResponse(trace: api.TraceResponse, colors: string[]): Span | null {
  const tree = buildTree(trace, colors);
  if (!tree) return null;

  // once all span children are in the tree, sort them by start time
  sortChildren(tree);

  return tree;
}
