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
import produce from 'immer';
import { DashboardSpec, PanelDefinition } from '@perses-dev/core';
import { DashboardAppSlice, createDashboardAppSlice } from './DashboardAppSlice';
import { createLayoutEditorSlice, LayoutEditorSlice } from './layout-editing';

export interface DashboardStoreState extends DashboardAppSlice, LayoutEditorSlice {
  dashboard: DashboardSpec;
  panels: Record<string, PanelDefinition>;
  updatePanel: (name: string, panel: PanelDefinition, groupIndex?: number) => void;
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
}

export interface DashboardStoreProps {
  dashboardSpec: DashboardSpec;
  isEditMode?: boolean;
}
export interface DashboardProviderProps {
  initialState: DashboardStoreProps;
  children?: React.ReactNode;
}

export function usePanels() {
  return useDashboardStore(({ panels, updatePanel }) => ({ panels, updatePanel }));
}

export function useEditMode() {
  return useDashboardStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
}

export function useDashboard() {
  const selectDashboardSpec = (state: DashboardStoreState) => {
    return produce(state.dashboard, (draftState) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draftState.panels = state.panels as any;
      draftState.layouts = state.layouts;
    });
  };
  const dashboard = useDashboardStore(selectDashboardSpec);
  return { dashboard };
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
          ...createDashboardAppSlice(...args),
          ...createLayoutEditorSlice(layouts)(...args),
          panels,
          dashboard: dashboardSpec,
          // TODO: Move this logic into a PanelEditor slice
          updatePanel: (name: string, panel: PanelDefinition, groupIndex = 0) => {
            const { addPanelToGroup, panels } = get();
            // add new panel to layouts if panels[name] is undefined
            if (panels[name] === undefined) {
              addPanelToGroup(name, groupIndex);
            }
            set((state) => {
              state.panels[name] = panel;
            });
          },
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
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
