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

interface ExplorerState<T> {
  explorer: string;
  data: T;
  // tab: number;
  // queries: QueryDefinition[];
}

interface ExplorerManagerContextType<T> {
  /** observability signal, for example metrics or traces */
  explorer: string;
  data: T;
  setExplorer: (explorer: string) => void;
  setData: (data: T) => void;
}

const ExplorerManagerContext = createContext<ExplorerManagerContextType<unknown> | undefined>(undefined);

interface ExplorerManagerProviderProps {
  children: ReactNode;
  store?: [ExplorerState<unknown>, (state: ExplorerState<unknown>) => void];
}

export function ExplorerManagerProvider({ children, store: externalStore }: ExplorerManagerProviderProps) {
  // cache the state of currently not rendered explore UIs
  const [explorerStateCache, setExplorerStateCache] = useState<
    Record<string, Omit<ExplorerState<unknown>, 'explorer'>>
  >({});
  // local store in case external store is not provided by prop
  const localStore = useState<ExplorerState<unknown>>({ explorer: 'metrics', data: {} });
  // use store provided by 'store' prop if available, otherwise use local store
  const [explorerState, setExplorerState] = externalStore ? externalStore : localStore;
  const { explorer, data } = explorerState;

  function setExplorer(newExplorer: string) {
    // store current explorer state
    explorerStateCache[explorer] = { data };
    setExplorerStateCache(explorerStateCache);

    // restore previous explorer state (if any)
    const state = explorerStateCache[newExplorer] ?? { data: {} };
    setExplorerState({ explorer: newExplorer, data: state.data });
  }

  function setData(newData: unknown) {
    setExplorerState({ explorer, data: newData });
  }

  return (
    <ExplorerManagerContext.Provider value={{ explorer, data, setExplorer, setData }}>
      {children}
    </ExplorerManagerContext.Provider>
  );
}

export function useExplorerManagerContext<T>(): ExplorerManagerContextType<T> {
  const ctx = useContext(ExplorerManagerContext);
  if (ctx === undefined) {
    throw new Error('No ExplorerManagerContext found. Did you forget a Provider?');
  }
  return ctx as ExplorerManagerContextType<T>;
}
