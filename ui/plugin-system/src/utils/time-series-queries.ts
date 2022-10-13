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
import { usePluginRegistry, usePlugin } from '../components';
import { useTemplateVariableValues, useTimeRange, useDatasourceStore } from '../runtime';

export interface UseTimeSeriesQueryOptions {
  suggestedStepMs?: number;
}

/**
 * Runs a time series query using a plugin and returns the results.
 */
export const useTimeSeriesQuery = (definition: TimeSeriesQueryDefinition, options?: UseTimeSeriesQueryOptions) => {
  const { data: plugin } = usePlugin('TimeSeriesQuery', definition.spec.plugin.kind);
  const context = useTimeSeriesQueryContext(options);

  const key = [definition, context] as const;
  return useQuery(
    key,
    ({ queryKey }) => {
      // The 'enabled' option should prevent this from happening, but make TypeScript happy by checking
      if (plugin === undefined) {
        throw new Error('Expected plugin to be loaded');
      }
      const [definition, context] = queryKey;
      return plugin.getTimeSeriesData(definition.spec.plugin.spec, context);
    },
    { enabled: plugin !== undefined }
  );
};

/**
 * Runs multiple time series queries using plugins and returns the results.
 */
export function useTimeSeriesQueries(definitions: TimeSeriesQueryDefinition[], options?: UseTimeSeriesQueryOptions) {
  const { getPlugin } = usePluginRegistry();
  const context = useTimeSeriesQueryContext(options);

  return useQueries({
    queries: definitions.map((definition) => ({
      queryKey: [definition, context] as const,
      queryFn: async () => {
        const plugin = await getPlugin('TimeSeriesQuery', definition.spec.plugin.kind);
        const data = await plugin.getTimeSeriesData(definition.spec.plugin.spec, context);
        return data;
      },
    })),
  });
}

function useTimeSeriesQueryContext(options?: UseTimeSeriesQueryOptions): TimeSeriesQueryContext {
  // Build the context object from data available at runtime
  const { timeRange } = useTimeRange();
  const variableState = useTemplateVariableValues();
  const datasourceStore = useDatasourceStore();

  return {
    suggestedStepMs: options?.suggestedStepMs,
    timeRange,
    variableState,
    datasourceStore,
  };
}
