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
 * The Options object type supported by the TraceTable panel plugin.
 */
// Note: The interface attributes must match cue/schemas/panels/trace-table/trace-table.cue
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TraceTableOptions {}

/**
 * Creates the initial/empty options for a TraceTable panel.
 */
export function createInitialTraceTableOptions() {
  return {};
}
