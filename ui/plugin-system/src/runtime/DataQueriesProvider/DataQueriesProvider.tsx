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

import { createContext, useCallback, useContext, useMemo } from 'react';
import { Definition, TimeSeriesQueryDefinition, UnknownSpec } from '@perses-dev/core';
import { useTimeSeriesQueries } from '../time-series-queries';
import { DataQueriesProviderProps, QueryData, UseDataQueriesResult } from './model';

export function useDataQueries(): UseDataQueriesResult {
  const ctx = useDataQueriesContext();
  return ctx;
}

export const DataQueriesContext = createContext<UseDataQueriesResult | undefined>(undefined);

export function useDataQueriesContext() {
  const ctx = useContext(DataQueriesContext);
  if (ctx === undefined) {
    throw new Error('No DataQueriesContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function DataQueriesProvider(props: DataQueriesProviderProps) {
  const { definitions, options, children } = props;

  // For now we will map each query plugin definition to TimeSeriesQueryDefinition
  // Later on when we add support for other query types,
  // we will have to map each query maps to the correct QueryDefinition
  const timeSeriesQueries = definitions.map(
    (definition) =>
      ({
        kind: 'TimeSeriesQuery',
        spec: {
          plugin: definition,
        },
      } as TimeSeriesQueryDefinition)
  );
  const results = useTimeSeriesQueries(timeSeriesQueries, options);

  const data = results.map(({ data, isFetching, isLoading, refetch, error }, i) => {
    return {
      definition: definitions[i],
      data,
      isFetching,
      isLoading,
      refetch,
      error,
    } as QueryData<Definition<UnknownSpec>>;
  });

  const refetchAll = useCallback(() => {
    results.forEach((result) => result.refetch());
  }, [results]);

  const ctx = useMemo(() => {
    return {
      queryResults: data,
      isFetching: results.some((result) => result.isFetching),
      isLoading: results.some((result) => result.isLoading),
      refetchAll,
    };
  }, [data, results, refetchAll]);

  return <DataQueriesContext.Provider value={ctx}>{children}</DataQueriesContext.Provider>;
}
