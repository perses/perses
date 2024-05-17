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

interface ExplorerManagerContextType {
  explorer: number;
  tab: number;
  queries: QueryDefinition[];
  setExplorer: (explorer: number) => void;
  setTab: (tab: number) => void;
  setQueries: (queries: QueryDefinition[]) => void;
}

interface ExplorerManagerInitialState extends Omit<ExplorerManagerContextType, 'explorer' | 'tab' | 'queries'> {
  explorer?: number;
  tab?: number;
  queries?: QueryDefinition[];
}

const ExplorerManagerContext = createContext<ExplorerManagerContextType | undefined>(undefined);

interface ExplorerManagerProviderProps {
  children: ReactNode;
  initialState?: ExplorerManagerInitialState;
}

export function ExplorerManagerProvider({ children, initialState }: ExplorerManagerProviderProps) {
  const [explorer, setInternalExplorer] = useState<number>(initialState?.explorer ?? 0);
  const [tab, setInternalTab] = useState<number>(initialState?.tab ?? 0);
  const [queries, setInternalQueries] = useState<QueryDefinition[]>(initialState?.queries ?? []);

  function setExplorer(explorer: number) {
    setInternalTab(0);
    setInternalQueries([]);
    setInternalExplorer(explorer);
    if (initialState?.setExplorer) {
      initialState.setExplorer(explorer);
    }
  }

  function setTab(tab: number) {
    setInternalTab(tab);
    if (initialState?.setTab) {
      initialState.setTab(tab);
    }
  }

  function setQueries(queries: QueryDefinition[]) {
    setInternalQueries(queries);
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
    throw new Error('No ConfigContext found. Did you forget a Provider?');
  }
  return ctx;
}
