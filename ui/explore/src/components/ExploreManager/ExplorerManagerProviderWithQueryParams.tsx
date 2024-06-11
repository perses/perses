// Copyright 2024 The Perses Authors
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

import React, { ReactNode } from 'react';

import { JsonParam, NumberParam, useQueryParams } from 'use-query-params';
import { QueryDefinition } from '@perses-dev/core';
import { ExplorerManagerProvider } from './ExplorerManagerProvider';

const exploreQueryConfig = {
  explorer: NumberParam,
  tab: NumberParam,
  queries: JsonParam,
};

interface ExplorerManagerProviderWithQueryParamsProps {
  children: ReactNode;
}

export function ExplorerManagerProviderWithQueryParams({ children }: ExplorerManagerProviderWithQueryParamsProps) {
  const [queryParams, setQueryParams] = useQueryParams(exploreQueryConfig, { updateType: 'replaceIn' });

  const initialState = {
    explorer: queryParams.explorer ?? undefined, // can be null, forcing to undefined
    tab: queryParams.tab ?? undefined, // can be null, forcing to undefined
    queries: queryParams.queries ? (queryParams.queries as QueryDefinition[]) : undefined,
    setExplorer: (explorer: number | undefined) => {
      setQueryParams({ explorer, queries: undefined, tab: undefined });
    },
    setTab: (tab: number | undefined) => setQueryParams({ tab }),
    setQueries: (queries: QueryDefinition[] | undefined) => setQueryParams({ queries }),
  };

  return <ExplorerManagerProvider initialState={initialState}>{children}</ExplorerManagerProvider>;
}
