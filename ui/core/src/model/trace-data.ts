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

export interface TraceMetaData {
  executedQueryString?: string;
}

export interface TraceValue {
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
 */
export interface TraceData {
  traces: TraceValue[];
  metadata?: TraceMetaData;
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
