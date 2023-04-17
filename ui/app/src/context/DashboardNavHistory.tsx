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

import React, { createContext, useContext, useReducer, Dispatch, useMemo } from 'react';

const PERSES_DASHBOARD_NAV_HISTORY_KEY = 'PERSES_DASHBOARD_NAV_HISTORY';

export interface DashboardNavHistoryItem {
  project: string;
  name: string;
  date: string;
}

const NavHistoryContext = createContext<DashboardNavHistoryItem[] | undefined>(undefined);
const NavHistoryDispatchContext = createContext<Dispatch<{ project: string; name: string }>>(() => undefined);

export function NavHistoryProvider(props: { children: React.ReactNode }) {
  const initial = useMemo(() => JSON.parse(window.localStorage.getItem(PERSES_DASHBOARD_NAV_HISTORY_KEY) || '[]'), []);
  const [history, dispatch] = useReducer(historyReducer, initial);

  return (
    <NavHistoryContext.Provider value={history}>
      <NavHistoryDispatchContext.Provider value={dispatch}>{props.children}</NavHistoryDispatchContext.Provider>
    </NavHistoryContext.Provider>
  );
}

function historyReducer(history: DashboardNavHistoryItem[], resource: { project: string; name: string }) {
  const index = history.findIndex((item) => item.project === resource.project && item.name === resource.name);
  if (index > -1) {
    // If the history already contains the dashboard, remove it
    history.splice(index, 1);
  }
  // Push dashboard to the beginning of the array (ordered by more recent project visited) with the current date
  history.unshift({
    project: resource.project,
    name: resource.name,
    date: new Date().toISOString(),
  });

  // Limiting history to 100 items only
  history = history.slice(0, 100);

  window.localStorage.setItem(PERSES_DASHBOARD_NAV_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function useNavHistory(): DashboardNavHistoryItem[] {
  const ctx = useContext(NavHistoryContext);
  if (ctx === undefined) {
    throw new Error('No NavHistoryContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useNavHistoryDispatch(): Dispatch<{ project: string; name: string }> {
  const ctx = useContext(NavHistoryDispatchContext);
  if (ctx === undefined) {
    throw new Error('No NavHistoryDispatchContext found. Did you forget a Provider?');
  }
  return ctx;
}
