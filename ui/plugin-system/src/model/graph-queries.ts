// Copyright 2022 The Perses Authors
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

import { AbsoluteTimeRange, GraphQueryDefinition, UnixTimeMs } from '@perses-dev/core';
import { useQuery } from 'react-query';
import { usePlugin } from '../components/PluginLoadingBoundary';
import {
  LegacyDatasources,
  useLegacyDatasources,
  useTemplateVariableValues,
  useTimeRange,
  VariableStateMap,
} from '../runtime';

/**
 * A plugin for running graph queries.
 */
export interface GraphQueryPlugin<Spec = unknown> {
  getGraphData: (definition: GraphQueryDefinition<Spec>, ctx: GraphQueryContext) => Promise<GraphData>;
}

/**
 * Context available to GraphQuery plugins at runtime.
 */
export interface GraphQueryContext {
  suggestedStepMs?: number;
  timeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
  datasources: LegacyDatasources;
}

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

type UseGraphQueryOptions = {
  suggestedStepMs?: number;
};

/**
 * Use a Graph Query's results from a graph query plugin at runtime.
 */
export const useGraphQuery = (definition: GraphQueryDefinition, options?: UseGraphQueryOptions) => {
  const plugin = usePlugin('GraphQuery', definition.spec.plugin.kind);

  // Build the context object from data available at runtime
  const { timeRange } = useTimeRange();
  const variableState = useTemplateVariableValues();
  const datasources = useLegacyDatasources();

  const context: GraphQueryContext = {
    suggestedStepMs: options?.suggestedStepMs,
    timeRange,
    variableState,
    datasources,
  };

  const key = [definition, context] as const;
  const { data, isLoading, error } = useQuery(
    key,
    ({ queryKey }) => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      const [definition, context] = queryKey;
      return plugin.getGraphData(definition, context);
    },
    { enabled: plugin !== undefined }
  );

  // TODO: Stop aliasing fields, just return the hook results directly once we clean up query running in panels
  return { data, loading: isLoading, error: error ?? undefined };
};
