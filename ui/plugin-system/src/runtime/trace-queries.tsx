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

import { QueryDefinition, UnknownSpec } from '@perses-dev/core';
import { useQueries } from '@tanstack/react-query';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry } from './plugin-registry';

export type TraceQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'TraceQuery', PluginSpec>;
export const TRACE_QUERY_KEY = 'TraceQuery';

/**
 * Run a trace query using a TraceQuery plugin and return the results
 * @param definition: dashboard defintion for a trace query, written in Trace Query Language (TraceQL)
 * Documentation for TraceQL: https://grafana.com/docs/tempo/latest/traceql/
 */
export function useTraceQueries(definitions: TraceQueryDefinition[]) {
  const { getPlugin } = usePluginRegistry();

  const datasourceStore = useDatasourceStore();
  const ctx = {
    datasourceStore,
  };

  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = [definition, datasourceStore] as const;
      const traceQueryKind = definition?.spec?.plugin?.kind;
      return {
        queryKey: queryKey,
        queryFn: async () => {
          const plugin = await getPlugin(TRACE_QUERY_KEY, traceQueryKind);
          const data = await plugin.getTraceData(definition.spec.plugin.spec, ctx);
          return data;
        },
      };
    }),
  });
}
