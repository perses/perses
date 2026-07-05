// Copyright The Perses Authors
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

import React, { createContext, useContext, useReducer, Dispatch, ReactElement } from 'react';

const PERSES_DASHBOARD_NAV_HISTORY_KEY = 'PERSES_DASHBOARD_NAV_HISTORY';

export interface DashboardNavHistoryItem {
  project: string;
  name: string;
  date: string;
}

const NavHistoryContext = createContext<DashboardNavHistoryItem[] | undefined>(undefined);
const NavHistoryDispatchContext = createContext<
  Dispatch<{ project: string; name: string } | { type: 'remove'; project: string; name: string }>
>(() => undefined);

export type NavHistoryAction = { type: 'remove'; project: string; name: string };

function loadInitialHistory(): DashboardNavHistoryItem[] {
  try {
    return JSON.parse(window.localStorage.getItem(PERSES_DASHBOARD_NAV_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function NavHistoryProvider(props: { children: React.ReactNode }): ReactElement {
  // Lazy initializer: localStorage is read only once, on first render
  const [history, dispatch] = useReducer(historyReducer, undefined, loadInitialHistory);

  return (
    <NavHistoryContext.Provider value={history}>
      <NavHistoryDispatchContext.Provider value={dispatch}>{props.children}</NavHistoryDispatchContext.Provider>
    </NavHistoryContext.Provider>
  );
}

function historyReducer(
  history: DashboardNavHistoryItem[],
  resource: { project: string; name: string } | { type: 'remove'; project: string; name: string }
): DashboardNavHistoryItem[] {
  // Handle remove action
  if ('type' in resource && resource.type === 'remove') {
    const newHistory = history.filter((item) => !(item.project === resource.project && item.name === resource.name));
    window.localStorage.setItem(PERSES_DASHBOARD_NAV_HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  }

  // Handle add/update action.
  // Build a new array instead of mutating the previous state: reducers must be
  // pure, otherwise StrictMode's double invocation would duplicate entries.
  const newHistory = [
    // Push dashboard to the beginning of the array (ordered by more recent project visited) with the current date
    {
      project: resource.project,
      name: resource.name,
      date: new Date().toISOString(),
    },
    // If the history already contains the dashboard, remove it
    ...history.filter((item) => !(item.project === resource.project && item.name === resource.name)),
    // Limiting history to 100 items only
  ].slice(0, 100);

  window.localStorage.setItem(PERSES_DASHBOARD_NAV_HISTORY_KEY, JSON.stringify(newHistory));
  return newHistory;
}

/**
 * NB: NavHistory is used to feed the "Recent dashboards" section
 */

export function useNavHistory(): DashboardNavHistoryItem[] {
  const ctx = useContext(NavHistoryContext);
  if (ctx === undefined) {
    throw new Error('No NavHistoryContext found. Did you forget a Provider?');
  }
  return ctx;
}

export function useNavHistoryDispatch(): Dispatch<{ project: string; name: string } | NavHistoryAction> {
  const ctx = useContext(NavHistoryDispatchContext);
  if (ctx === undefined) {
    throw new Error('No NavHistoryDispatchContext found. Did you forget a Provider?');
  }
  return ctx;
}
