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

import create from 'zustand';
import type { StoreApi } from 'zustand';
import createZustandContext from 'zustand/context';
import produce from 'immer';
import { DashboardSpec, GridItemDefinition, LayoutDefinition, PanelDefinition } from '@perses-dev/core';

interface DashboardState {
  dashboard: DashboardSpec;
  isEditMode: boolean;
  layouts: LayoutDefinition[];
  panels: Record<string, PanelDefinition>;
}

interface DashboardActions {
  setEditMode: (isEditMode: boolean) => void;
  setLayouts: (layouts: LayoutDefinition[]) => void;
  addLayout: (layout: LayoutDefinition) => void;
  addItemToLayout: (index: number, item: GridItemDefinition) => void;
  setPanels: (panels: Record<string, PanelDefinition>) => void;
  addPanel: (name: string, panel: PanelDefinition) => void;
}

export type DashboardStoreState = DashboardState & DashboardActions;

export interface DashboardStoreProps {
  dashboardSpec: DashboardSpec;
  isEditMode?: boolean;
}
export interface DashboardProviderProps {
  initialState: DashboardStoreProps;
  children?: React.ReactNode;
}

const { Provider, useStore } = createZustandContext<StoreApi<DashboardStoreState>>();

export function usePanels() {
  const { panels, addPanel } = useStore(({ panels, addPanel }) => ({ panels, addPanel }));
  return { panels, addPanel };
}

export function useLayouts() {
  const { layouts, setLayouts, addLayout, addItemToLayout } = useStore(
    ({ layouts, setLayouts, addLayout, addItemToLayout }) => ({
      layouts,
      setLayouts,
      addLayout,
      addItemToLayout,
    })
  );
  return { layouts, setLayouts, addLayout, addItemToLayout };
}

export function useEditMode() {
  const { isEditMode, setEditMode } = useStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
  return { isEditMode, setEditMode };
}

export function useDashboard() {
  const selectDashboardSpec = (state: DashboardStoreState) => {
    return produce(state.dashboard, (draftState) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      draftState.panels = state.panels as any;
      draftState.layouts = state.layouts;
    });
  };
  const dashboard = useStore(selectDashboardSpec);
  return { dashboard };
}

export function DashboardProvider(props: DashboardProviderProps) {
  const {
    children,
    initialState: { dashboardSpec, isEditMode },
  } = props;

  const { layouts, panels } = dashboardSpec;

  return (
    <Provider
      createStore={() =>
        create((set) => ({
          layouts,
          panels,
          dashboard: dashboardSpec,
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
          setLayouts: (layouts: LayoutDefinition[]) => set({ layouts }),
          addLayout: (layout: LayoutDefinition) =>
            set(
              produce((state) => {
                state.layouts.push(layout);
              })
            ),
          addItemToLayout: (index: number, item: GridItemDefinition) =>
            set(
              produce((state) => {
                state.layouts[index].spec.items.push(item);
              })
            ),
          setPanels: (panels: Record<string, PanelDefinition>) => set({ panels }),
          addPanel: (name: string, panel: PanelDefinition) => {
            set(
              produce((state: DashboardStoreState) => {
                state.panels[name] = panel;
              }, {})
            );
          },
        }))
      }
    >
      {children}
    </Provider>
  );
}
