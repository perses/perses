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

import { Definition, TimeSeriesData, UnknownSpec } from '@perses-dev/core';

type QueryOptions = Record<string, unknown>;

interface DataQueriesDefinitions<QueryPluginDefinition> {
  definitions: QueryPluginDefinition[];
}
export interface DataQueriesProviderProps<QueryPluginDefinition = Definition<UnknownSpec>>
  extends DataQueriesDefinitions<QueryPluginDefinition> {
  options?: QueryOptions;
  children?: React.ReactNode;
}

export interface UseDataQueriesResult<QueryPluginDefinition = Definition<UnknownSpec>> {
  queryResults: Array<QueryData<QueryPluginDefinition>>;
  refetchAll: () => void;
  isFetching: boolean;
  isLoading: boolean;
}

export interface QueryData<QueryPluginDefinition> {
  data?: TimeSeriesData;
  definition: QueryPluginDefinition;
  error: unknown;
  isFetching: boolean;
  isLoading: boolean;
  refetch?: () => void;
}
