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
  startTimeUnixMs: number;
  durationMs: number;
  spanCount?: number;
  errorCount?: number;
  traceId?: string;
  name?: string;
}

/**
 * A generalized data-model that will be used by Panel components
 * to display traces.
 */
export interface TraceData {
  traces: TraceValue[];
  metadata?: TraceMetaData;
}
