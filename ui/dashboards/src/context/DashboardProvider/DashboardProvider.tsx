// Copyright 2022 The Perses Authors
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

import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import shallow from 'zustand/shallow';
import { createContext, useContext } from 'react';
import { DashboardSpec, RelativeTimeRange } from '@perses-dev/core';
import { createPanelGroupEditorSlice, PanelGroupEditorSlice } from './panel-group-editor-slice';
import { createPanelGroupSlice, PanelGroupSlice } from './panel-group-slice';
import { createPanelEditorSlice, PanelEditorSlice } from './panel-editor-slice';

export interface DashboardStoreState extends PanelGroupEditorSlice, PanelGroupSlice, PanelEditorSlice {
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
  defaultTimeRange: RelativeTimeRange;
  reset: () => void;
  save: () => void;
}

export interface DashboardStoreProps {
  dashboardSpec: DashboardSpec;
  isEditMode?: boolean;
}

export interface DashboardProviderProps {
  initialState: DashboardStoreProps;
  children?: React.ReactNode;
}

export const DashboardContext = createContext<StoreApi<DashboardStoreState> | undefined>(undefined);

export function useDashboardStore<T>(selector: (state: DashboardStoreState) => T) {
  const store = useContext(DashboardContext);
  if (store === undefined) {
    throw new Error('No DashboardContext found. Did you forget a Provider?');
  }
  return useStore(store, selector, shallow);
}

export function DashboardProvider(props: DashboardProviderProps) {
  const {
    children,
    initialState: { dashboardSpec, isEditMode },
  } = props;

  const { layouts, panels } = dashboardSpec;

  const dashboardStore = createStore<DashboardStoreState>()(
    immer(
      devtools((...args) => {
        const [set, get] = args;
        return {
          ...createPanelGroupEditorSlice(...args),
          ...createPanelGroupSlice(layouts)(...args),
          ...createPanelEditorSlice(panels)(...args),
          defaultTimeRange: { pastDuration: dashboardSpec.duration },
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
          reset: () => {
            const { resetPanels, resetPanelGroups } = get();
            resetPanels();
            resetPanelGroups();
          },
          save: () => {
            const { savePanels, savePanelGroups } = get();
            savePanels();
            savePanelGroups();
          },
        };
      })
    )
  );

  return (
    <DashboardContext.Provider value={dashboardStore as StoreApi<DashboardStoreState>}>
      {children}
    </DashboardContext.Provider>
  );
}
