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
import { PanelGroupId, PanelGroupSlice } from './panel-group-slice';
import { PanelSlice } from './panel-slice';

/**
 * Slice that handles the visual editor state and related actions for deleting a Panel Group.
 */
export interface DeletePanelGroupSlice {
  deletePanelGroupDialog?: DeletePanelGroupDialogState;

  /**
   * Delete panel group and all the panels within the group
   */
  deletePanelGroup: (panelGroupId: PanelGroupId) => void;

  openDeletePanelGroupDialog: (panelGroupId: PanelGroupId) => void;
  closeDeletePanelGroupDialog: () => void;
}

export interface DeletePanelGroupDialogState {
  panelGroupId: PanelGroupId;
  panelGroupName?: string;
}

export const createDeletePanelGroupSlice: StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  DeletePanelGroupSlice & PanelGroupSlice & PanelSlice,
  Middleware,
  [],
  DeletePanelGroupSlice
> = (set, get) => ({
  deletePanelGroup(panelGroupId) {
    const { panelGroups, panelGroupOrder } = get();
    const group = panelGroups[panelGroupId];
    const idIndex = panelGroupOrder.findIndex((id) => id === panelGroupId);
    if (group === undefined || idIndex === -1) {
      throw new Error(`Panel group ${panelGroupId} not found`);
    }

    // Get the panel keys for all the panel items in the group we're going to delete
    const panelKeys = Object.values(group.itemPanelKeys);

    set((draft) => {
      // Delete the panel group which also deletes all its items
      delete draft.panelGroups[panelGroupId];
      draft.panelGroupOrder.splice(idIndex, 1);

      // Get all remaining panel keys in use
      const usedPanelKeys = getUsedPanelKeys(draft.panelGroups);

      // For the panel keys of the items that were just deleted, see if they're still used and if not, also delete the
      // panel definition
      for (const panelKey of panelKeys) {
        if (usedPanelKeys.has(panelKey)) continue;

        delete draft.panels[panelKey];
      }
    });
  },

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

// Helper to get the panel keys of all groups, returning a set to eliminate duplicates
function getUsedPanelKeys(panelGroups: PanelGroupSlice['panelGroups']): Set<string> {
  const usedPanelKeys = new Set<string>();
  for (const group of Object.values(panelGroups)) {
    for (const panelKey of Object.values(group.itemPanelKeys)) {
      usedPanelKeys.add(panelKey);
    }
  }
  return usedPanelKeys;
}
