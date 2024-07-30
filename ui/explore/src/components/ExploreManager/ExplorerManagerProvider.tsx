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

interface ExplorerState {
  explorer: string;
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
  store?: [ExplorerState, (state: ExplorerState) => void];
}

export function ExplorerManagerProvider({ children, store: externalStore }: ExplorerManagerProviderProps) {
  // cache the state of currently not rendered explore UIs
  const [explorerStateCache, setExplorerStateCache] = useState<Record<string, Omit<ExplorerState, 'explorer'>>>({});
  // local store in case external store is not provided by prop
  const localStore = useState<ExplorerState>({ explorer: 'metrics', tab: 0, queries: [] });
  // use store provided by 'store' prop if available, otherwise use local store
  const [explorerState, setExplorerState] = externalStore ? externalStore : localStore;
  const { explorer, tab, queries } = explorerState;

  function setExplorer(newExplorer: string) {
    // store current explorer state
    explorerStateCache[explorer] = { tab, queries };
    setExplorerStateCache(explorerStateCache);

    // restore previous explorer state (if any)
    const state = explorerStateCache[newExplorer] ?? { tab: 0, queries: [] };
    setExplorerState({ explorer: newExplorer, tab: state.tab, queries: state.queries });
  }

  function setTab(newTab: number) {
    setExplorerState({ explorer, tab: newTab, queries });
  }

  function setQueries(newQueries: QueryDefinition[]) {
    setExplorerState({ explorer, tab, queries: newQueries });
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
