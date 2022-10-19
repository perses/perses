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

import { getPanelKeyFromRef } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';
import { PanelGroupSlice, PanelGroupItemId, mapPanelToPanelGroups } from './panel-group-slice';
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
  deletePanelDialog?: DeletePanelDialogState;

  /**
   * Open delete panel dialog
   */
  openDeletePanelDialog: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * Close delete panel dialog
   */
  closeDeletePanelDialog: () => void;
}

export interface DeletePanelDialogState {
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
      set((draft) => {
        const existingGroup = draft.panelGroups[panelGroupItemId.panelGroupId];
        if (existingGroup === undefined) {
          throw new Error(`Missing panel group ${panelGroupItemId.panelGroupId}`);
        }
        const existingItem = existingGroup.items[panelGroupItemId.itemIndex];
        if (existingItem === undefined) {
          throw new Error(`Missing panel group item ${panelGroupItemId.itemIndex}`);
        }

        // get panel key first before deleting panel
        const panelKey = getPanelKeyFromRef(existingItem.content);

        // remove panel from panel group
        existingGroup.items.splice(panelGroupItemId.itemIndex, 1);

        // See if panel key is still used and if not, delete it
        const usedGroupIds = mapPanelToPanelGroups(draft.panelGroups)[panelKey];
        if (usedGroupIds === undefined || usedGroupIds.length === 0) {
          delete draft.panels[panelKey];
        }
      });
    },

    openDeletePanelDialog(panelGroupItemId: PanelGroupItemId) {
      const { panels, panelGroups } = get();
      const panelGroup = panelGroups[panelGroupItemId.panelGroupId];
      if (panelGroup === undefined) {
        throw new Error(`Panel group not found ${panelGroupItemId.panelGroupId}`);
      }

      const content = panelGroup.items[panelGroupItemId.itemIndex]?.content;
      if (content === undefined) {
        throw new Error(`Could not find Panel Group item ${panelGroupItemId}`);
      }

      const panelKey = getPanelKeyFromRef(content);
      const panel = panels[panelKey];
      if (panel === undefined) {
        throw new Error(`Could not find panel ${panelKey}`);
      }

      set((state) => {
        state.deletePanelDialog = {
          panelGroupItemId: panelGroupItemId,
          panelName: panel.spec.display.name,
          panelGroupName: panelGroup.title ?? '',
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
