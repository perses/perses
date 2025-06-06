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

import { createStore } from 'zustand';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import type { StoreApi } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createContext, ReactElement, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  DashboardResource,
  Display,
  ProjectMetadata,
  DurationString,
  DEFAULT_REFRESH_INTERVAL,
  DatasourceSpec,
  EphemeralDashboardResource,
} from '@perses-dev/core';
import { usePlugin, usePluginRegistry } from '@perses-dev/plugin-system';
import { createPanelGroupEditorSlice, PanelGroupEditorSlice } from './panel-group-editor-slice';
import { convertLayoutsToPanelGroups, createPanelGroupSlice, PanelGroupSlice } from './panel-group-slice';
import { createPanelEditorSlice, PanelEditorSlice } from './panel-editor-slice';
import { createPanelSlice, PanelSlice } from './panel-slice';
import { createDeletePanelGroupSlice, DeletePanelGroupSlice } from './delete-panel-group-slice';
import { createDeletePanelSlice, DeletePanelSlice } from './delete-panel-slice';
import { createDiscardChangesDialogSlice, DiscardChangesConfirmationDialogSlice } from './discard-changes-dialog-slice';
import { createSaveChangesDialogSlice, SaveChangesConfirmationDialogSlice } from './save-changes-dialog-slice';
import { createDuplicatePanelSlice, DuplicatePanelSlice } from './duplicate-panel-slice';
import { createEditJsonDialogSlice, EditJsonDialogSlice } from './edit-json-dialog-slice';
import { createPanelDefinition } from './common';
import { createViewPanelSlice, ViewPanelSlice } from './view-panel-slice';

export interface DashboardStoreState
  extends PanelGroupSlice,
    PanelSlice,
    PanelGroupEditorSlice,
    DeletePanelGroupSlice,
    PanelEditorSlice,
    DeletePanelSlice,
    DiscardChangesConfirmationDialogSlice,
    DuplicatePanelSlice,
    EditJsonDialogSlice,
    SaveChangesConfirmationDialogSlice,
    ViewPanelSlice {
  isEditMode: boolean;
  setEditMode: (isEditMode: boolean) => void;
  setDashboard: (dashboard: DashboardResource | EphemeralDashboardResource) => void;
  kind: DashboardResource['kind'] | EphemeralDashboardResource['kind'];
  metadata: ProjectMetadata;
  duration: DurationString;
  refreshInterval: DurationString;
  timeZone: string;
  display?: Display;
  datasources?: Record<string, DatasourceSpec>;
  ttl?: DurationString;
}

export interface DashboardStoreProps {
  dashboardResource: DashboardResource | EphemeralDashboardResource;
  isEditMode?: boolean;
  viewPanelRef?: string;
  setViewPanelRef?: (viewPanelRef: string | undefined) => void;
  timeZone: string;
  setTimeZone: (timeZone: string) => void;
}

export interface DashboardProviderProps {
  initialState: DashboardStoreProps;
  children?: ReactNode;
}

export const DashboardContext = createContext<StoreApi<DashboardStoreState> | undefined>(undefined);

export function useDashboardStore<T>(selector: (state: DashboardStoreState) => T): T {
  const store = useContext(DashboardContext);
  if (store === undefined) {
    throw new Error('No DashboardContext found. Did you forget a Provider?');
  }
  return useStoreWithEqualityFn(store, selector, shallow);
}

export function DashboardProvider(props: DashboardProviderProps): ReactElement {
  const createDashboardStore = useCallback(initStore, [props]);

  // load plugin to retrieve initial spec if default panel kind is defined
  const { defaultPluginKinds } = usePluginRegistry();
  const defaultPanelKind = defaultPluginKinds?.['Panel'] ?? '';
  const { data: plugin } = usePlugin('Panel', defaultPanelKind);

  const [store] = useState(createDashboardStore(props)); // prevent calling createDashboardStore every time it rerenders

  useEffect(() => {
    if (plugin === undefined) return;
    const defaultPanelSpec = plugin.createInitialOptions ? plugin.createInitialOptions() : {};
    // set default panel kind, spec, and queries for add panel editor
    store.setState({
      initialValues: {
        panelDefinition: createPanelDefinition(defaultPanelKind, defaultPanelSpec),
      },
    });
  }, [plugin, store, defaultPanelKind]);

  return (
    <DashboardContext.Provider value={store as StoreApi<DashboardStoreState>}>
      {props.children}
    </DashboardContext.Provider>
  );
}

function initStore(props: DashboardProviderProps): StoreApi<DashboardStoreState> {
  const {
    initialState: { dashboardResource, isEditMode, viewPanelRef, setViewPanelRef, timeZone },
  } = props;

  const {
    kind,
    metadata,
    spec: { display, duration, refreshInterval = DEFAULT_REFRESH_INTERVAL, datasources },
  } = dashboardResource;

  const ttl = 'ttl' in dashboardResource.spec ? dashboardResource.spec.ttl : undefined;

  let {
    spec: { layouts, panels },
  } = dashboardResource;

  // Set fallbacks in case the frontend is used with a non-Perses backend
  layouts = layouts ?? [];
  panels = panels ?? {};

  const store = createStore<DashboardStoreState>()(
    immer(
      devtools((...args) => {
        const [set] = args;
        return {
          /* Groups */
          ...createPanelGroupSlice(layouts)(...args),
          ...createPanelGroupEditorSlice(...args),
          ...createDeletePanelGroupSlice(...args),
          /* Panels */
          ...createPanelSlice(panels)(...args),
          ...createPanelEditorSlice()(...args),
          ...createDeletePanelSlice()(...args),
          ...createDuplicatePanelSlice()(...args),
          ...createViewPanelSlice(viewPanelRef, setViewPanelRef)(...args),
          /* General */
          ...createDiscardChangesDialogSlice(...args),
          ...createEditJsonDialogSlice(...args),
          ...createSaveChangesDialogSlice(...args),
          kind,
          metadata,
          display,
          duration,
          refreshInterval,
          timeZone,
          datasources,
          ttl,
          isEditMode: !!isEditMode,
          setEditMode: (isEditMode: boolean): void => set({ isEditMode }),
          setDashboard: ({
            kind,
            metadata,
            spec: { display, panels = {}, layouts = [], duration, refreshInterval, datasources = {} },
          }): void => {
            set((state) => {
              state.kind = kind;
              state.metadata = metadata;
              state.display = display;
              state.panels = panels;
              const { panelGroups, panelGroupOrder } = convertLayoutsToPanelGroups(layouts);
              state.panelGroups = panelGroups;
              state.panelGroupOrder = panelGroupOrder;
              state.duration = duration;
              state.refreshInterval = refreshInterval ?? DEFAULT_REFRESH_INTERVAL;
              state.timeZone = timeZone;
              state.datasources = datasources;
              // TODO: add ttl here to e.g allow edition from JSON view, but probably requires quite some refactoring
            });
          },
        };
      })
    )
  );

  return store;
}
