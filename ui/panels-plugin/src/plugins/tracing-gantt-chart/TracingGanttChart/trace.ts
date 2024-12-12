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

import { Span, Trace } from '@perses-dev/core';

/** holds the trace and computed properties required for the Gantt chart */
export interface GanttTrace {
  rootSpan: Span;

  // computed properties of the rootSpan
  startTimeUnixMs: number;
  endTimeUnixMs: number;
}

/** this function precomputes common fields, for example the start and end time of a trace */
export function getTraceModel(trace: Trace): GanttTrace {
  const limits = { startTimeUnixMs: trace.rootSpan.startTimeUnixMs, endTimeUnixMs: trace.rootSpan.endTimeUnixMs };
  getStartAndEndTime(trace.rootSpan, limits);

  return {
    rootSpan: trace.rootSpan,
    startTimeUnixMs: limits.startTimeUnixMs,
    endTimeUnixMs: limits.endTimeUnixMs,
  };
}

/**
 * Compute the start and end of a trace.
 * In most cases (but not all) this is rootSpan.startTime / rootSpan.endTime.
 */
function getStartAndEndTime(span: Span, limits: { startTimeUnixMs: number; endTimeUnixMs: number }): void {
  if (span.startTimeUnixMs < limits.startTimeUnixMs) {
    limits.startTimeUnixMs = span.startTimeUnixMs;
  }
  if (span.endTimeUnixMs > limits.endTimeUnixMs) {
    limits.endTimeUnixMs = span.endTimeUnixMs;
  }

  for (const child of span.childSpans) {
    getStartAndEndTime(child, limits);
  }
}
