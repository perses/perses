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

import { Definition, QueryDefinition, UnknownSpec, QueryDataType } from '@perses-dev/core';
import { QueryObserverOptions, UseQueryResult } from '@tanstack/react-query';
import { ReactNode, useCallback, useMemo } from 'react';
import { useListPluginMetadata } from '../plugin-registry';

export type QueryOptions = Record<string, unknown>;
export interface DataQueriesProviderProps<QueryPluginSpec = UnknownSpec> {
  definitions: Array<Definition<QueryPluginSpec>>;
  children?: ReactNode;
  options?: QueryOptions;
  queryOptions?: Omit<QueryObserverOptions, 'queryKey'>;
}

export interface DataQueriesContextType {
  queryResults: QueryData[];
  refetchAll: () => void;
  isFetching: boolean;
  isLoading: boolean;
  errors: unknown[];
}

export interface UseDataQueryResults<T> extends Omit<DataQueriesContextType, 'queryResults'> {
  queryResults: Array<QueryData<T>>;
}

export type QueryData<T = QueryDataType> = {
  data?: T;
  definition: QueryDefinition;
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
  refetch?: () => void;
};

export function transformQueryResults(results: UseQueryResult[], definitions: QueryDefinition[]): QueryData[] {
  return results.map(({ data, isFetching, isLoading, refetch, error }, i) => {
    return {
      definition: definitions[i],
      data,
      isFetching,
      isLoading,
      refetch,
      error,
    } as QueryData;
  });
}

export function useQueryType(): (pluginKind: string) => string | undefined {
  const { data: timeSeriesQueryPlugins, isLoading: isTimeSeriesQueryLoading } = useListPluginMetadata([
    'TimeSeriesQuery',
  ]);
  const { data: traceQueryPlugins, isLoading: isTraceQueryPluginLoading } = useListPluginMetadata(['TraceQuery']);

  // For example, `map: {"TimeSeriesQuery":["PrometheusTimeSeriesQuery"],"TraceQuery":["TempoTraceQuery"]}`
  const queryTypeMap = useMemo(() => {
    const map: Record<string, string[]> = {
      TimeSeriesQuery: [],
      TraceQuery: [],
    };

    if (timeSeriesQueryPlugins) {
      timeSeriesQueryPlugins.forEach((plugin) => {
        map[plugin.kind]?.push(plugin.spec.name);
      });
    }

    if (traceQueryPlugins) {
      traceQueryPlugins.forEach((plugin) => {
        map[plugin.kind]?.push(plugin.spec.name);
      });
    }
    return map;
  }, [timeSeriesQueryPlugins, traceQueryPlugins]);

  const getQueryType = useCallback(
    (pluginKind: string) => {
      const isLoading = (pluginKind: string): boolean => {
        switch (pluginKind) {
          case 'PrometheusTimeSeriesQuery':
            return isTimeSeriesQueryLoading;
          case 'TempoTraceQuery':
            return isTraceQueryPluginLoading;
        }
        throw new Error(`Unable to determine the query type: ${pluginKind}`);
      };

      if (isLoading(pluginKind)) {
        return undefined;
      }

      for (const queryType in queryTypeMap) {
        if (queryTypeMap[queryType]?.includes(pluginKind)) {
          return queryType;
        }
      }

      throw new Error(`Unable to determine the query type: ${pluginKind}`);
    },
    [queryTypeMap, isTimeSeriesQueryLoading, isTraceQueryPluginLoading]
  );

  return getQueryType;
}
