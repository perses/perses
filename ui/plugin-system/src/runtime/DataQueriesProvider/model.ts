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

import { Definition, QueryDefinition, QueryType, UnknownSpec, QueryDataType } from '@perses-dev/core';
import { UseQueryResult } from '@tanstack/react-query';

type QueryOptions = Record<string, unknown>;

export interface DataQueriesDefinition extends Definition<UnknownSpec> {
  /**
   * @default 'TimeSeriesQuery'
   */
  type?: keyof QueryType;
}

export interface DataQueriesProviderProps {
  definitions: DataQueriesDefinition[];
  options?: QueryOptions;
  children?: React.ReactNode;
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

export function transformQueryResults(results: UseQueryResult[], definitions: QueryDefinition[]) {
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
