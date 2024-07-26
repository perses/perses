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

import React, { createContext, ReactNode, useContext, useState } from 'react';
import { QueryDefinition } from '@perses-dev/core';
import { createEnumParam, JsonParam, NumberParam, useQueryParams, withDefault } from 'use-query-params';

interface ExplorerState {
  tab: number;
  queries: QueryDefinition[];
}

interface ExplorerManagerContextType {
  /** observability signal, for example metrics or traces */
  explorer: string;
  tab: number;
  queries: QueryDefinition[];
  setExplorer: (explorer: string) => void;
  setTab: (tab: number) => void;
  setQueries: (queries: QueryDefinition[]) => void;
}

const ExplorerManagerContext = createContext<ExplorerManagerContextType | undefined>(undefined);

interface ExplorerManagerProviderProps {
  children: ReactNode;
}

const exploreQueryConfig = {
  explorer: withDefault(createEnumParam(['metrics', 'traces']), 'metrics'),
  tab: withDefault(NumberParam, 0),
  queries: withDefault(JsonParam, []),
};

export function ExplorerManagerProvider({ children }: ExplorerManagerProviderProps) {
  const [queryParams, setQueryParams] = useQueryParams(exploreQueryConfig);
  const [explorerStates, setExplorerStates] = useState<Record<string, ExplorerState>>({});
  const { explorer, tab, queries } = queryParams;

  function setExplorer(newExplorer: string) {
    // store current explorer state
    explorerStates[explorer] = { tab, queries };
    setExplorerStates(explorerStates);

    // restore previous explorer state (if any)
    const state = explorerStates[newExplorer] ?? { tab: 0, queries: [] };
    setQueryParams({ explorer: newExplorer, tab: state.tab, queries: state.queries });
  }

  function setTab(newTab: number) {
    setQueryParams({ explorer, tab: newTab, queries });
  }

  function setQueries(newQueries: QueryDefinition[]) {
    // If the previous query was empty, skip it in the browser history.
    // For example, when navigating from metrics explorer -> traces (empty query) -> traces (some query) -> traces (gantt chart),
    // pressing the back button should navigate to traces (some query) -> metrics, skipping the traces page with an empty query.
    const updateUrl = queries.length === 0 ? 'replaceIn' : 'pushIn';

    // Be explicit and always set all query parameters in the URL.
    setQueryParams({ explorer, tab, queries: newQueries }, updateUrl);
  }

  return (
    <ExplorerManagerContext.Provider value={{ explorer, tab, queries, setExplorer, setTab, setQueries }}>
      {children}
    </ExplorerManagerContext.Provider>
  );
}

export function useExplorerManagerContext(): ExplorerManagerContextType {
  const ctx = useContext(ExplorerManagerContext);
  if (ctx === undefined) {
    throw new Error('No ExplorerManagerContext found. Did you forget a Provider?');
  }
  return ctx;
}
