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

import { createStore, useStore } from 'zustand';
import type { StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import shallow from 'zustand/shallow';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DashboardResource, ProjectMetadata, RelativeTimeRange, UnknownSpec } from '@perses-dev/core';
import { usePlugin, usePluginRegistry } from '@perses-dev/plugin-system';
import { createPanelGroupEditorSlice, PanelGroupEditorSlice } from './panel-group-editor-slice';
import { convertLayoutsToPanelGroups, createPanelGroupSlice, PanelGroupSlice } from './panel-group-slice';
import { createPanelEditorSlice, PanelEditorSlice } from './panel-editor-slice';
import { createPanelSlice, PanelSlice } from './panel-slice';
import { createDeletePanelGroupSlice, DeletePanelGroupSlice } from './delete-panel-group-slice';
import { createDeletePanelSlice, DeletePanelSlice } from './delete-panel-slice';
import { createDiscardChangesDialogSlice, DiscardChangesConfirmationDialogSlice } from './discard-changes-dialog-slice';

export interface DashboardStoreState
  extends PanelGroupSlice,
    PanelSlice,
    PanelGroupEditorSlice,
    DeletePanelGroupSlice,
    PanelEditorSlice,
    DeletePanelSlice,
    DiscardChangesConfirmationDialogSlice {
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
  defaultTimeRange: RelativeTimeRange;
  setDashboard: (dashboard: DashboardResource) => void;
  metadata: ProjectMetadata;
}

export interface DashboardStoreProps {
  dashboardResource: DashboardResource;
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
  const createDashboardStore = useCallback(initStore, [props]);
  const [store, setStore] = useState(createDashboardStore(props)); // prevent calling createDashboardStore every time it rerenders

  // load plugin to retrieve initial spec if default panel kind is defined
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultPanelKind = defaultPluginKinds?.['Panel'] ?? '';
  const { data: plugin } = usePlugin('Panel', defaultPanelKind);

  useEffect(() => {
    if (plugin === undefined) return;
    const spec = plugin.createInitialOptions();
    // reinitialize store to set default panel spec
    setStore(createDashboardStore(props, { kind: defaultPanelKind, spec }));
  }, [plugin, defaultPanelKind, props, createDashboardStore]);

  return (
    <DashboardContext.Provider value={store as StoreApi<DashboardStoreState>}>
      {props.children}
    </DashboardContext.Provider>
  );
}

function initStore(props: DashboardProviderProps, defaultPanel?: { kind: string; spec: UnknownSpec }) {
  const {
    initialState: { dashboardResource, isEditMode },
  } = props;

  const {
    spec: { layouts, panels, duration },
    metadata,
  } = dashboardResource;
  const store = createStore<DashboardStoreState>()(
    immer(
      devtools((...args) => {
        const [set] = args;
        return {
          ...createPanelGroupSlice(layouts)(...args),
          ...createPanelSlice(panels)(...args),
          ...createPanelGroupEditorSlice(...args),
          ...createDeletePanelGroupSlice(...args),
          ...createPanelEditorSlice(defaultPanel)(...args),
          ...createDeletePanelSlice()(...args),
          ...createDiscardChangesDialogSlice(...args),
          metadata,
          defaultTimeRange: { pastDuration: duration },
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
          setDashboard: ({ metadata, spec: { panels, layouts } }) => {
            set((state) => {
              state.metadata = metadata;
              const { panelGroups, panelGroupOrder } = convertLayoutsToPanelGroups(layouts);
              state.panels = panels;
              state.panelGroups = panelGroups;
              state.panelGroupOrder = panelGroupOrder;
            });
          },
        };
      })
    )
  );

  return store;
}
