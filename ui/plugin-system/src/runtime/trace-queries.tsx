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
import { QueryDefinition, UnknownSpec, AbsoluteTimeRange } from '@perses-dev/core';
import { useQueries } from '@tanstack/react-query';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
export type TraceQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TraceQuery', PluginSpec>;
export const TRACE_QUERY_KEY = 'TraceQuery';

export function getUnixTimeRange(timeRange: AbsoluteTimeRange) {
  const { start, end } = timeRange;
  return {
    start: Math.ceil(getUnixTime(start)),
    end: Math.ceil(getUnixTime(end)),
  };
}

/**
 * Run a trace query using a TraceQuery plugin and return the results
 * @param definition: dashboard defintion for a trace query, written in Trace Query Language (TraceQL)
 * Documentation for TraceQL: https://grafana.com/docs/tempo/latest/traceql/
 */
export function useTraceQueries(definitions: TraceQueryDefinition[]) {
  const { getPlugin } = usePluginRegistry();
  const datasourceStore = useDatasourceStore();
  const { absoluteTimeRange } = useTimeRange();

  const context = {
    datasourceStore,
    absoluteTimeRange,
  };

  // useQueries() handles data fetching from query plugins (e.g. traceQL queries, promQL queries)
  // https://tanstack.com/query/v4/docs/react/reference/useQuery
  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = [definition, datasourceStore, absoluteTimeRange] as const; // `queryKey` watches and reruns `queryFn` if keys in the array change
      const traceQueryKind = definition?.spec?.plugin?.kind;
      return {
        queryKey: queryKey,
        queryFn: async () => {
          const plugin = await getPlugin(TRACE_QUERY_KEY, traceQueryKind);
          const data = await plugin.getTraceData(definition.spec.plugin.spec, context);
          return data;
        },

        // The data returned by getTraceData() contains circular dependencies (a span has a reference to the parent span, and the parent span has an array of child spans)
        // Therefore structuralSharing must be turned off, otherwise the query is stuck in the 'fetching' state on re-fetch.
        // Ref: https://github.com/TanStack/query/issues/6954#issuecomment-1962321426
        structuralSharing: false,
      };
    }),
  });
}
