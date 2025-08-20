// Copyright 2025 The Perses Authors
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
import { useQueries, UseQueryResult } from '@tanstack/react-query';
import { LogQueryResult } from '../model/log-queries';
import { useDatasourceStore } from './datasources';
import { usePluginRegistry } from './plugin-registry';
import { useTimeRange } from './TimeRangeProvider';
import { useVariableValues } from './variables';

export type LogQueryDefinition<PluginSpec = UnknownSpec> = QueryDefinition<'LogQuery', PluginSpec>;
export const LOG_QUERY_KEY = 'LogQuery';

export function useLogQueries(definitions: LogQueryDefinition[]): Array<UseQueryResult<LogQueryResult>> {
  const { getPlugin } = usePluginRegistry();
  const datasourceStore = useDatasourceStore();
  const { absoluteTimeRange } = useTimeRange();
  const variableValues = useVariableValues();

  const context = {
    timeRange: absoluteTimeRange,
    variableState: variableValues,
    datasourceStore,
    refreshKey: '',
  };

  return useQueries({
    queries: definitions.map((definition) => {
      const queryKey = [definition, datasourceStore, absoluteTimeRange, variableValues] as const;
      const logQueryKind = definition?.spec?.plugin?.kind;
      return {
        queryKey: queryKey,
        queryFn: async (): Promise<LogQueryResult> => {
          const plugin = await getPlugin(LOG_QUERY_KEY, logQueryKind);
          const data = await plugin.getLogData(definition.spec.plugin.spec, context);
          return data;
        },

        structuralSharing: false,
      };
    }),
  });
}
