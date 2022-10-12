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

import { StateCreator } from 'zustand';
import { Middleware } from './common';
import { LayoutSlice, PanelGroupId } from './layout-slice';

export interface PanelGroupDialog {
  panelGroupId?: PanelGroupId;
}

export interface DeletePanelGroupDialog {
  panelGroupId: PanelGroupId;
  panelGroupName?: string;
}

export interface PanelGroupSlice {
  panelGroupDialog?: PanelGroupDialog;
  openPanelGroupDialog: (panelGroupId?: PanelGroupId) => void;
  closePanelGroupDialog: () => void;

  deletePanelGroupDialog?: DeletePanelGroupDialog;
  openDeletePanelGroupDialog: (panelGroupId: PanelGroupId) => void;
  closeDeletePanelGroupDialog: () => void;
}

export const createPanelGroupSlice: StateCreator<PanelGroupSlice & LayoutSlice, Middleware, [], PanelGroupSlice> = (
  set,
  get
) => ({
  openPanelGroupDialog: (panelGroupId) =>
    set((state) => {
      state.panelGroupDialog = { panelGroupId };
    }),
  closePanelGroupDialog: () =>
    set((state) => {
      state.panelGroupDialog = undefined;
    }),
  openDeletePanelGroupDialog: (panelGroupId) => {
    const panelGroup = get().panelGroups[panelGroupId];
    if (panelGroup === undefined) {
      throw new Error(`Panel group with Id ${panelGroupId} not found`);
    }
    set((state) => {
      state.deletePanelGroupDialog = { panelGroupId, panelGroupName: panelGroup.title };
    });
  },
  closeDeletePanelGroupDialog: () =>
    set((state) => {
      state.deletePanelGroupDialog = undefined;
    }),
});
