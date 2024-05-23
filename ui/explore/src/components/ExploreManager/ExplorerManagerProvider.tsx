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

import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { QueryDefinition } from '@perses-dev/core';

interface ExplorerState {
  tab: number;
  queries: QueryDefinition[];
}

interface ExplorerManagerContextType {
  explorer: number;
  tab: number;
  queries: QueryDefinition[];
  setExplorer: (explorer: number) => void;
  setTab: (tab: number) => void;
  setQueries: (queries: QueryDefinition[]) => void;
}

interface ExplorerManagerInitialState {
  explorer?: number;
  tab?: number;
  queries?: QueryDefinition[];
  setExplorer: (explorer: number | undefined) => void;
  setTab: (tab: number | undefined) => void;
  setQueries: (queries: QueryDefinition[] | undefined) => void;
}

const ExplorerManagerContext = createContext<ExplorerManagerContextType | undefined>(undefined);

interface ExplorerManagerProviderProps {
  children: ReactNode;
  initialState?: ExplorerManagerInitialState;
}

function initExplorerStates(initialState?: ExplorerManagerInitialState): ExplorerState[] {
  const result: ExplorerState[] = [];
  if (initialState?.explorer || initialState?.tab || initialState?.queries) {
    result[initialState?.explorer ?? 0] = {
      tab: initialState?.tab ?? 0,
      queries: initialState?.queries ?? [],
    };
  }
  return result;
}

export function ExplorerManagerProvider({ children, initialState }: ExplorerManagerProviderProps) {
  const [explorerStates, setExplorerStates] = useState<ExplorerState[]>(initExplorerStates(initialState));
  const [explorer, setInternalExplorer] = useState<number>(initialState?.explorer ?? 1);
  const tab: number = useMemo(() => explorerStates[explorer]?.tab ?? 1, [explorer, explorerStates]);
  const queries: QueryDefinition[] = useMemo(() => explorerStates[explorer]?.queries ?? [], [explorer, explorerStates]);

  function setExplorer(explorer: number) {
    setInternalExplorer(explorer);
    if (initialState?.setExplorer) {
      initialState.setExplorer(explorer);
      initialState.setTab(explorerStates[explorer]?.tab);
      initialState.setQueries(explorerStates[explorer]?.queries);
    }
  }

  function setTab(tab: number) {
    const state = [...explorerStates];
    state[explorer] = { tab, queries: state[explorer]?.queries ?? [] };
    setExplorerStates(state);
    if (initialState?.setTab) {
      initialState.setTab(tab);
    }
  }

  function setQueries(queries: QueryDefinition[]) {
    const state = [...explorerStates];
    state[explorer] = { tab: state[explorer]?.tab ?? 0, queries: queries };
    setExplorerStates(state);
    if (initialState?.setQueries) {
      initialState?.setQueries(queries);
    }
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
