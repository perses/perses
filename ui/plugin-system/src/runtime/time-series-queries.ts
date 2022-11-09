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

import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { useQuery, useQueries } from '@tanstack/react-query';
import { TimeSeriesQueryContext } from '../model';
import { TimeSeriesQueryPlugin } from '../model';
import { VariableStateMap } from './template-variables';
import { useTemplateVariableValues } from './template-variables';
import { useTimeRange } from './time-range';
import { useDatasourceStore } from './datasources';
import { usePlugin, usePluginRegistry, usePlugins } from './plugin-registry';

export interface UseTimeSeriesQueryOptions {
  suggestedStepMs?: number;
}

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
  const { timeRange, datasourceStore, suggestedStepMs, variableState } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  const queryKey = [definition, timeRange, datasourceStore, suggestedStepMs, variablesValueKey] as const;

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
  const { data: plugin } = usePlugin('TimeSeriesQuery', definition.spec.plugin.kind);
  const context = useTimeSeriesQueryContext();

  const { queryEnabled: pluginEnabled, queryKey } = getQueryOptions({ plugin, definition, context });

  return useQuery(
    queryKey,
    () => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      // Keep options out of query key so we don't re-run queries because suggested step changes
      const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
      return plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx);
    },
    { enabled: pluginEnabled }
  );
};

/**
 * Runs multiple time series queries using plugins and returns the results.
 */
export function useTimeSeriesQueries(definitions: TimeSeriesQueryDefinition[], options?: UseTimeSeriesQueryOptions) {
  const { getPlugin } = usePluginRegistry();
  const context = useTimeSeriesQueryContext();

  const pluginLoaderResponse = usePlugins(
    'TimeSeriesQuery',
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  return useQueries({
    queries: definitions.map((definition, idx) => {
      const resp = pluginLoaderResponse[idx];
      const plugin = resp?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ plugin, definition, context });
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        queryFn: async () => {
          // Keep options out of query key so we don't re-run queries because suggested step changes
          const ctx: TimeSeriesQueryContext = { ...context, suggestedStepMs: options?.suggestedStepMs };
          const plugin = await getPlugin('TimeSeriesQuery', definition.spec.plugin.kind);
          const data = await plugin.getTimeSeriesData(definition.spec.plugin.spec, ctx);
          return data;
        },
      };
    }),
  });
}

function useTimeSeriesQueryContext(): TimeSeriesQueryContext {
  // Build the context object from data available at runtime
  const { timeRange } = useTimeRange();
  const variableState = useTemplateVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    timeRange,
    variableState,
    datasourceStore,
  };
}
