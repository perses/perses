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

import { useQuery, useQueries, useQueryClient, Query, QueryCache, QueryKey } from '@tanstack/react-query';
import { TimeSeriesQueryDefinition, UnknownSpec, TimeSeriesData } from '@perses-dev/core';
import { TimeSeriesDataQuery, TimeSeriesQueryContext, TimeSeriesQueryPlugin } from '../model';
import { VariableStateMap } from './template-variables';
import { useTemplateVariableValues } from './template-variables';
import { useTimeRange } from './TimeRangeProvider';
import { useDatasourceStore } from './datasources';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';

export interface UseTimeSeriesQueryOptions {
  suggestedStepMs?: number;
}

export const TIME_SERIES_QUERY_KEY = 'TimeSeriesQuery';

/**
 * Returns a serialized string of the current state of variable values.
 */
function getVariableValuesKey(v: VariableStateMap) {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

function filterVariableStateMap(v: VariableStateMap, names?: string[]) {
  if (!names) {
    return v;
  }
  return Object.fromEntries(Object.entries(v).filter(([name]) => names.includes(name)));
}

function getQueryOptions({
  plugin,
  definition,
  context,
}: {
  plugin?: TimeSeriesQueryPlugin;
  definition: TimeSeriesQueryDefinition;
  context: TimeSeriesQueryContext;
}) {
  const { timeRange, datasourceStore, suggestedStepMs, variableState, refreshKey } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  // Determine queryKey
  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  const queryKey = [definition, timeRange, datasourceStore, suggestedStepMs, variablesValueKey, refreshKey] as const;

  // Determine queryEnabled
  let waitToLoad = false;
  if (variableDependencies) {
    waitToLoad = variableDependencies.some((v) => variableState[v]?.loading);
  }

  const queryEnabled = plugin !== undefined && !waitToLoad;

  return {
    queryKey,
    queryEnabled,
  };
}

/**
 * Runs a time series query using a plugin and returns the results.
 */
export const useTimeSeriesQuery = (definition: TimeSeriesQueryDefinition, options?: UseTimeSeriesQueryOptions) => {
  const { data: plugin } = usePlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind);
  const context = useTimeSeriesQueryContext();

  const { queryEnabled, queryKey } = getQueryOptions({ plugin, definition, context });
  return useQuery({
    enabled: queryEnabled,
    queryKey: queryKey,
    queryFn: () => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      // Keep options out of query key so we don't re-run queries because suggested step changes
      const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
      return plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx);
    },
  });
};

/**
 * Runs multiple time series queries using plugins and returns the results.
 */
export function useTimeSeriesQueries(definitions: TimeSeriesQueryDefinition[], options?: UseTimeSeriesQueryOptions) {
  const { getPlugin } = usePluginRegistry();
  const context = useTimeSeriesQueryContext();

  const pluginLoaderResponse = usePlugins(
    TIME_SERIES_QUERY_KEY,
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ plugin, definition, context });
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        queryFn: async () => {
          // Keep options out of query key so we don't re-run queries because suggested step changes
          const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
          const plugin = await getPlugin(TIME_SERIES_QUERY_KEY, definition.spec.plugin.kind);
          const data = await plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx);
          return data;
        },
      };
    }),
  });
}

/**
 * Build the time series query context object from data available at runtime
 */
function useTimeSeriesQueryContext(): TimeSeriesQueryContext {
  const { absoluteTimeRange, refreshKey } = useTimeRange();
  const variableState = useTemplateVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    timeRange: absoluteTimeRange,
    variableState,
    datasourceStore,
    refreshKey,
  };
}

/**
 * Get active time series queries for query results summary
 */
export function useActiveTimeSeriesQueries() {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();
  return getActiveTimeSeriesQueries(queryCache);
}

/**
 * Filter all cached queries down to only active time series queries
 */
export function getActiveTimeSeriesQueries(cache: QueryCache) {
  const queries: TimeSeriesDataQuery[] = [];

  for (const query of cache.findAll({ type: 'active' })) {
    const firstPart = query.queryKey?.[0] as UnknownSpec;
    if (firstPart?.kind && (firstPart.kind as string).startsWith(TIME_SERIES_QUERY_KEY)) {
      queries.push(query as Query<TimeSeriesData, unknown, TimeSeriesData, QueryKey>);
    }
  }

  return queries;
}
