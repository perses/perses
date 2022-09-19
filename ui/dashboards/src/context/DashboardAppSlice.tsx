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

import { immer } from 'zustand/middleware/immer';
import { useDashboardStore } from './DashboardProvider';

interface PanelDrawer {
  groupIndex?: number;
  panelRef?: string;
}
interface PanelGroupDialog {
  groupIndex?: number;
}

export interface DashboardAppSlice {
  panelDrawer?: PanelDrawer;
  openPanelDrawer: (panelDrawer: PanelDrawer) => void;
  closePanelDrawer: () => void;
  panelGroupDialog?: PanelGroupDialog;
  openPanelGroupDialog: (groupIndex: number) => void;
  closePanelGroupDialog: () => void;
}

export const createDashboardAppSlice = immer<DashboardAppSlice>((set) => ({
  openPanelDrawer: ({ groupIndex, panelRef }: PanelDrawer) =>
    set((state) => {
      state.panelDrawer = {
        groupIndex,
        panelRef,
      };
    }),
  closePanelDrawer: () =>
    set((state) => {
      state.panelDrawer = undefined;
    }),
  openPanelGroupDialog: (groupIndex: number) =>
    set((state) => {
      state.panelGroupDialog = { groupIndex };
    }),
  closePanelGroupDialog: () =>
    set((state) => {
      state.panelGroupDialog = undefined;
    }),
}));

export function useDashboardApp() {
  return useDashboardStore(
    ({
      panelDrawer,
      openPanelDrawer,
      closePanelDrawer,
      panelGroupDialog,
      openPanelGroupDialog,
      closePanelGroupDialog,
    }) => ({
      panelDrawer,
      openPanelDrawer,
      closePanelDrawer,
      panelGroupDialog,
      openPanelGroupDialog,
      closePanelGroupDialog,
    })
  );
}
