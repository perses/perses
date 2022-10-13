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

export interface PanelGroupDialog {
  groupIndex?: number;
}

export interface PanelGroupSlice {
  panelGroupDialog?: PanelGroupDialog;
  openPanelGroupDialog: (groupIndex?: number) => void;
  closePanelGroupDialog: () => void;
  deletePanelGroupDialog?: PanelGroupDialog;
  openDeletePanelGroupDialog: (groupIndex: number) => void;
  closeDeletePanelGroupDialog: () => void;
}

export const createPanelGroupSlice: StateCreator<PanelGroupSlice, Middleware, [], PanelGroupSlice> = (set) => ({
  openPanelGroupDialog: (groupIndex?: number) =>
    set((state) => {
      state.panelGroupDialog = { groupIndex };
    }),
  closePanelGroupDialog: () =>
    set((state) => {
      state.panelGroupDialog = undefined;
    }),
  openDeletePanelGroupDialog: (groupIndex: number) =>
    set((state) => {
      state.deletePanelGroupDialog = { groupIndex };
    }),
  closeDeletePanelGroupDialog: () =>
    set((state) => {
      state.deletePanelGroupDialog = undefined;
    }),
});
