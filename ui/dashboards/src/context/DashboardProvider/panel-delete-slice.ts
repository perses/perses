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
import { PanelGroupSlice, PanelGroupItemId, getPanelKey, deletePanelGroupItem } from './panel-group-slice';
import { PanelSlice } from './panel-slice';

/**
 * Slice that handles the visual editor state and actions for deleting Panels.
 */
export interface PanelDeleteSlice {
  /**
   * Delete panels
   */
  deletePanel: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * State for the delete panel dialog when it's open, otherwise undefined when it's closed.
   */
  deletePanelDialog?: DeletePanelDialog;

  /**
   * Open delete panel dialog
   */
  openDeletePanelDialog: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * Close delete panel dialog
   */
  closeDeletePanelDialog: () => void;
}

export interface DeletePanelDialog {
  panelGroupItemId: PanelGroupItemId;
  panelName: string;
  panelGroupName: string;
}

/**
 * Curried function for creating the PanelDeleteSlice.
 */
export function createPanelDeleteSlice(): StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  PanelDeleteSlice & PanelSlice & PanelGroupSlice,
  Middleware,
  [],
  PanelDeleteSlice
> {
  // Return the state creator function for Zustand that uses the panels provided as intitial state
  return (set, get) => ({
    deletePanel(panelGroupItemId: PanelGroupItemId) {
      const { panelGroups } = get();

      // get panel key first before deleting panel from panel group since getPanelKey relies on index
      const panelKey = getPanelKey(panelGroups, panelGroupItemId);
      set((state) => {
        const isStillUsed = deletePanelGroupItem(state, panelGroupItemId);
        if (isStillUsed === false) {
          delete state.panels[panelKey];
        }
      });
    },

    openDeletePanelDialog(item: PanelGroupItemId) {
      const { panels, panelGroups } = get();
      const panelKey = getPanelKey(panelGroups, item);
      set((state) => {
        state.deletePanelDialog = {
          panelGroupItemId: item,
          panelName: panels[panelKey]?.spec.display.name ?? '',
          panelGroupName: panelGroups[item.panelGroupId]?.title ?? '',
        };
      });
    },

    closeDeletePanelDialog() {
      set((state) => {
        state.deletePanelDialog = undefined;
      });
    },
  });
}
