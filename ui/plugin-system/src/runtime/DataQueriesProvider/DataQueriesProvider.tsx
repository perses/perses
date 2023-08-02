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
import { QueryType, TimeSeriesQueryDefinition } from '@perses-dev/core';
import { useTimeSeriesQueries } from '../time-series-queries';
import {
  DataQueriesProviderProps,
  UseDataQueryResults,
  transformQueryResults,
  DataQueriesContextType,
  QueryData,
  useQueryType,
} from './model';

export const DataQueriesContext = createContext<DataQueriesContextType | undefined>(undefined);

export function useDataQueriesContext() {
  const ctx = useContext(DataQueriesContext);
  if (ctx === undefined) {
    throw new Error('No DataQueriesContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useDataQueries<T extends keyof QueryType>(queryType: T): UseDataQueryResults<QueryType[T]> {
  const ctx = useDataQueriesContext();

  // Filter the query results based on the specified query type
  const filteredQueryResults = ctx.queryResults.filter(
    (queryResult) => queryResult.definition.kind === queryType
  ) as Array<QueryData<QueryType[T]>>;

  // Filter the errors based on the specified query type
  const filteredErrors = ctx.errors.filter((errors, index) => ctx.queryResults[index]?.definition.kind === queryType);

  // Create a new context object with the filtered results and errors
  const filteredCtx = {
    queryResults: filteredQueryResults,
    isFetching: filteredQueryResults.some((result) => result.isFetching),
    isLoading: filteredQueryResults.some((result) => result.isLoading),
    refetchAll: ctx.refetchAll,
    errors: filteredErrors,
  };

  return filteredCtx;
}

export function DataQueriesProvider(props: DataQueriesProviderProps) {
  const { definitions, options, children, queryOptions } = props;

  const getQueryType = useQueryType();

  const queryDefinitions = definitions.map((definition) => {
    const type = getQueryType(definition.kind);
    return {
      kind: type,
      spec: {
        plugin: definition,
      },
    };
  });

  // Filter definitions for time series query and other future query plugins
  const timeSeriesQueries = queryDefinitions.filter(
    (definition) => definition.kind === 'TimeSeriesQuery'
  ) as TimeSeriesQueryDefinition[];
  const timeSeriesResults = useTimeSeriesQueries(timeSeriesQueries, options, queryOptions);

  const refetchAll = useCallback(() => {
    timeSeriesResults.forEach((result) => result.refetch());
  }, [timeSeriesResults]);

  const ctx = useMemo(() => {
    const mergedQueryResults = [...transformQueryResults(timeSeriesResults, timeSeriesQueries)];

    return {
      queryResults: mergedQueryResults,
      isFetching: mergedQueryResults.some((result) => result.isFetching),
      isLoading: mergedQueryResults.some((result) => result.isLoading),
      refetchAll,
      errors: mergedQueryResults.map((result) => result.error),
    };
  }, [timeSeriesQueries, timeSeriesResults, refetchAll]);

  return <DataQueriesContext.Provider value={ctx}>{children}</DataQueriesContext.Provider>;
}
