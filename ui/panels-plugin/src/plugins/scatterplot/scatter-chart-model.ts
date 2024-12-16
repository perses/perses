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

import { UnknownSpec, QueryDefinition } from '@perses-dev/core';

export type TraceQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TraceQuery', PluginSpec>;

/**
 * The Options object type supported by the ScatterChart panel plugin.
 */
// TODO: Add support for scatter chart formatting options.
// Some scaffolding has been done to support formatting options.
// This includes the interface below which still needs implementation.
// Note: The interface attributes must match cue/schemas/panels/scatter/scatter.cue
export interface ScatterChartOptions {
  /** range of the circles diameter */
  sizeRange?: [number, number];
}

/**
 * Creates the initial/empty options for a ScatterChart panel.
 */
export function createInitialScatterChartOptions(): Record<string, unknown> {
  return {};
}
