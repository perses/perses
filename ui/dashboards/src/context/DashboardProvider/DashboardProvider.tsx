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
import { DashboardSpec, TimeRangeValue } from '@perses-dev/core';
import { createPanelGroupSlice, PanelGroupSlice } from './panel-group-slice';
import { createLayoutSlice, LayoutSlice } from './layout-slice';
import { createPanelEditorSlice, PanelEditorSlice } from './panel-editing-slice';

export interface DashboardStoreState extends PanelGroupSlice, LayoutSlice, PanelEditorSlice {
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
  selectedTimeRange: TimeRangeValue;
  setSelectedTimeRange: (value: TimeRangeValue) => void;
}

export interface DashboardStoreProps {
  dashboardSpec: DashboardSpec;
  isEditMode?: boolean;
  selectedTimeRange?: TimeRangeValue;
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
    initialState: { dashboardSpec, isEditMode, selectedTimeRange },
  } = props;

  const { layouts, panels } = dashboardSpec;

  const dashboardStore = createStore<DashboardStoreState>()(
    immer(
      devtools((...args) => {
        const [set] = args;
        return {
          ...createPanelGroupSlice(...args),
          ...createLayoutSlice(layouts)(...args),
          ...createPanelEditorSlice(panels)(...args),
          selectedTimeRange: selectedTimeRange ?? { pastDuration: dashboardSpec.duration },
          setSelectedTimeRange: (selectedTimeRange: TimeRangeValue) => set({ selectedTimeRange }),
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

export function useSelectedTimeRangeStore() {
  return useDashboardStore(({ selectedTimeRange, setSelectedTimeRange }) => ({
    selectedTimeRange,
    setSelectedTimeRange,
  }));
}
