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

import { getUnixTime } from 'date-fns';
import { QueryDefinition, UnknownSpec, AbsoluteTimeRange, TraceData } from '@perses-dev/core';
import { QueryKey, useQueries, UseQueryResult } from '@tanstack/react-query';
import { TraceQueryContext, TraceQueryPlugin } from '../model';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry, usePlugins } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { useAllVariableValues } from './variables';
import { filterVariableStateMap, getVariableValuesKey } from './utils';
export type TraceQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TraceQuery', PluginSpec>;
export const TRACE_QUERY_KEY = 'TraceQuery';

export function getUnixTimeRange(timeRange: AbsoluteTimeRange): { start: number; end: number } {
  const { start, end } = timeRange;
  return {
    start: Math.ceil(getUnixTime(start)),
    end: Math.ceil(getUnixTime(end)),
  };
}

/**
 * Run a trace query using a TraceQuery plugin and return the results
 * @param definitions: dashboard defintion for a trace query, written in Trace Query Language (TraceQL)
 * Documentation for TraceQL: https://grafana.com/docs/tempo/latest/traceql/
 */
export function useTraceQueries(definitions: TraceQueryDefinition[]): Array<UseQueryResult<TraceData>> {
  const { getPlugin } = usePluginRegistry();
  const context = useTraceQueryContext();

  const pluginLoaderResponse = usePlugins(
    'TraceQuery',
    definitions.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  // useQueries() handles data fetching from query plugins (e.g. traceQL queries, promQL queries)
  // https://tanstack.com/query/v4/docs/react/reference/useQuery
  return useQueries({
    queries: definitions.map((definition, idx) => {
      const plugin = pluginLoaderResponse[idx]?.data;
      const { queryEnabled, queryKey } = getQueryOptions({ context, definition, plugin });
      const traceQueryKind = definition?.spec?.plugin?.kind;
      return {
        enabled: queryEnabled,
        queryKey: queryKey,
        queryFn: async (): Promise<TraceData> => {
          const plugin = await getPlugin(TRACE_QUERY_KEY, traceQueryKind);
          const data = await plugin.getTraceData(definition.spec.plugin.spec, context);
          return data;
        },
      };
    }),
  });
}

function getQueryOptions({
  plugin,
  definition,
  context,
}: {
  plugin?: TraceQueryPlugin;
  definition: TraceQueryDefinition;
  context: TraceQueryContext;
}): {
  queryKey: QueryKey;
  queryEnabled: boolean;
} {
  const { datasourceStore, variableState, absoluteTimeRange } = context;

  const dependencies = plugin?.dependsOn ? plugin.dependsOn(definition.spec.plugin.spec, context) : {};
  const variableDependencies = dependencies?.variables;

  const filteredVariabledState = filterVariableStateMap(variableState, variableDependencies);
  const variablesValueKey = getVariableValuesKey(filteredVariabledState);
  const queryKey = [definition, datasourceStore, absoluteTimeRange, variablesValueKey] as const;

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

function useTraceQueryContext(): TraceQueryContext {
  const { absoluteTimeRange } = useTimeRange();
  const variableState = useAllVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    variableState,
    datasourceStore,
    absoluteTimeRange,
  };
}
