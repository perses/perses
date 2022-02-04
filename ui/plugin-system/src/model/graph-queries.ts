// Copyright 2021 The Perses Authors
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

import { AbsoluteTimeRange, Definition, JsonObject, ResourceSelector, UnixTimeMs } from '@perses-dev/core';
import { usePlugin } from '../components/PluginLoadingBoundary';

/**
 * Options that are common to all Graph Queries.
 */
export interface GraphQueryDefinition<Options extends JsonObject = JsonObject> extends Definition<Options> {
  datasource?: ResourceSelector;
}

/**
 * A plugin for running graph queries.
 */
export interface GraphQueryPlugin<Options extends JsonObject = JsonObject> {
  useGraphQuery: UseGraphQueryHook<Options>;
}

export type UseGraphQueryHook<Options extends JsonObject> = (definition: GraphQueryDefinition<Options>) => {
  data?: GraphData;
  loading: boolean;
  error?: Error;
};

export interface GraphData {
  timeRange: AbsoluteTimeRange;
  stepMs: number;
  series: Iterable<GraphSeries>;
}

export interface GraphSeries {
  name: string;
  values: Iterable<GraphSeriesValueTuple>;
}

export type GraphSeriesValueTuple = [timestamp: UnixTimeMs, value: number];

/**
 * Use a Graph Query's results from a graph query plugin at runtime.
 */
export const useGraphQuery: GraphQueryPlugin['useGraphQuery'] = (definition) => {
  const plugin = usePlugin('GraphQuery', definition);
  if (plugin === undefined) {
    // Provide default values while the plugin is being loaded
    return { loading: true };
  }
  return plugin.useGraphQuery(definition);
};
