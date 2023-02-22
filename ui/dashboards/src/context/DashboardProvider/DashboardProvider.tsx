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
import { shallow } from 'zustand/shallow';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { DashboardResource, Display, ProjectMetadata, RelativeTimeRange } from '@perses-dev/core';
import { usePlugin, usePluginRegistry } from '@perses-dev/plugin-system';
import { createPanelGroupEditorSlice, PanelGroupEditorSlice } from './panel-group-editor-slice';
import { convertLayoutsToPanelGroups, createPanelGroupSlice, PanelGroupSlice } from './panel-group-slice';
import { createPanelEditorSlice, PanelEditorSlice } from './panel-editor-slice';
import { createPanelSlice, PanelSlice } from './panel-slice';
import { createDeletePanelGroupSlice, DeletePanelGroupSlice } from './delete-panel-group-slice';
import { createDeletePanelSlice, DeletePanelSlice } from './delete-panel-slice';
import { createDiscardChangesDialogSlice, DiscardChangesConfirmationDialogSlice } from './discard-changes-dialog-slice';
import { createDuplicatePanelSlice, DuplicatePanelSlice } from './duplicate-panel-slice';

export interface DashboardStoreState
  extends PanelGroupSlice,
    PanelSlice,
    PanelGroupEditorSlice,
    DeletePanelGroupSlice,
    PanelEditorSlice,
    DeletePanelSlice,
    DiscardChangesConfirmationDialogSlice,
    DuplicatePanelSlice {
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
  defaultTimeRange: RelativeTimeRange;
  setDashboard: (dashboard: DashboardResource) => void;
  metadata: ProjectMetadata;
  display?: Display;
}

export interface DashboardStoreProps {
  dashboardResource: DashboardResource;
  isEditMode?: boolean;
}

export interface DashboardProviderProps {
  initialState: DashboardStoreProps;
  children?: ReactNode;
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

  // load plugin to retrieve initial spec if default panel kind is defined
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultPanelKind = defaultPluginKinds?.['Panel'] ?? '';
  const { data: plugin } = usePlugin('Panel', defaultPanelKind);

  const [store] = useState(createDashboardStore(props)); // prevent calling createDashboardStore every time it rerenders

  useEffect(() => {
    if (plugin === undefined) return;
    const spec = plugin.createInitialOptions();
    // set default panel kind and spec for add panel editor
    store.setState({ initialValues: { kind: defaultPanelKind, spec } });
  }, [plugin, store, defaultPanelKind]);

  return (
    <DashboardContext.Provider value={store as StoreApi<DashboardStoreState>}>
      {props.children}
    </DashboardContext.Provider>
  );
}

function initStore(props: DashboardProviderProps) {
  const {
    initialState: { dashboardResource, isEditMode },
  } = props;

  const {
    spec: { display, layouts, panels, duration },
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
          ...createPanelEditorSlice()(...args),
          ...createDeletePanelSlice()(...args),
          ...createDiscardChangesDialogSlice(...args),
          ...createDuplicatePanelSlice()(...args),
          metadata,
          display,
          defaultTimeRange: { pastDuration: duration },
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean) => set({ isEditMode }),
          setDashboard: ({ metadata, spec: { display, panels, layouts } }) => {
            set((state) => {
              state.metadata = metadata;
              state.display = display;
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
