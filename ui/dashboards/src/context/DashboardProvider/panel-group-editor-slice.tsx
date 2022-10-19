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
import {
  PanelGroupSlice,
  PanelGroupDefinition,
  PanelGroupId,
  getPanelKey,
  mapPanelToPanelGroups,
} from './panel-group-slice';
import { PanelSlice } from './panel-slice';

export interface PanelGroupEditor {
  mode: 'Add' | 'Edit';
  initialValues: PanelGroupEditorValues;
  applyChanges: (next: PanelGroupEditorValues) => void;
  close: () => void;
}

export interface PanelGroupEditorValues {
  title: string;
  isCollapsed: boolean;
}

export interface DeletePanelGroupDialog {
  panelGroupId: PanelGroupId;
  panelGroupName?: string;
}

/**
 * Slice that handles the visual editor state and related actions for Panel Groups (i.e. add, edit, delete).
 */
export interface PanelGroupEditorSlice {
  /**
   * State that's present when the panel group editor is open.
   */
  panelGroupEditor?: PanelGroupEditor;

  /**
   * Opens the panel group editor to add a new panel group.
   */
  openAddPanelGroup: () => void;

  /**
   * Opens the panel group editor to edit an existing panel group.
   */
  openEditPanelGroup: (panelGroupId: PanelGroupId) => void;

  deletePanelGroupDialog?: DeletePanelGroupDialog;

  /**
   * Delete panel group and all the panels within the group
   */
  deletePanelGroup: (panelGroupId: PanelGroupId) => void;

  openDeletePanelGroupDialog: (panelGroupId: PanelGroupId) => void;
  closeDeletePanelGroupDialog: () => void;
}

export const createPanelGroupEditorSlice: StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  PanelGroupEditorSlice & PanelGroupSlice & PanelSlice,
  Middleware,
  [],
  PanelGroupEditorSlice
> = (set, get) => ({
  panelGroupEditor: undefined,

  openAddPanelGroup: () => {
    // Create the editor state
    const editor: PanelGroupEditor = {
      mode: 'Add',
      initialValues: {
        title: '',
        isCollapsed: false,
      },
      applyChanges(next) {
        const newGroup: PanelGroupDefinition = {
          id: get().createPanelGroupId(),
          items: [],
          ...next,
        };
        set((draft) => {
          draft.panelGroups[newGroup.id] = newGroup;
          draft.panelGroupIdOrder.unshift(newGroup.id);
        });
      },
      close() {
        set((draft) => {
          draft.panelGroupEditor = undefined;
        });
      },
    };

    // Open the editor
    set((draft) => {
      draft.panelGroupEditor = editor;
    });
  },

  openEditPanelGroup: (panelGroupId) => {
    const existingGroup = get().panelGroups[panelGroupId];
    if (existingGroup === undefined) {
      throw new Error(`Panel group with Id ${panelGroupId} does not exist`);
    }

    // Create the editor state
    const editor: PanelGroupEditor = {
      mode: 'Edit',
      initialValues: {
        title: existingGroup.title ?? '',
        isCollapsed: existingGroup.isCollapsed,
      },
      applyChanges(next) {
        set((draft) => {
          const group = draft.panelGroups[panelGroupId];
          if (group === undefined) {
            throw new Error(`Panel group with Id ${panelGroupId} does not exist`);
          }
          group.title = next.title;
          group.isCollapsed = next.isCollapsed;
        });
      },
      close() {
        set((draft) => {
          draft.panelGroupEditor = undefined;
        });
      },
    };

    // Open the editor
    set((draft) => {
      draft.panelGroupEditor = editor;
    });
  },

  deletePanelGroup(panelGroupId) {
    const { panelGroups, panelGroupIdOrder } = get();
    const group = panelGroups[panelGroupId];
    const idIndex = panelGroupIdOrder.findIndex((id) => id === panelGroupId);
    if (group === undefined || idIndex === -1) {
      throw new Error(`Panel group ${panelGroupId} not found`);
    }

    // Get the panel keys for all the panel items in the group we're going to delete
    const panelKeys = group.items.map((item) => getPanelKeyFromRef(item.content));

    set((draft) => {
      // Delete the panel group which also deletes all its items
      delete draft.panelGroups[panelGroupId];
      draft.panelGroupIdOrder.splice(idIndex, 1);

      // Get usage of all remaining panel keys
      const panelKeyMap = mapPanelToPanelGroups(draft.panelGroups);

      // For the panel keys of the items that were just deleted, see if they're still used and if not, also delete the
      // panel definition
      for (const panelKey of panelKeys) {
        const panelKeyUsage = panelKeyMap[panelKey];
        if (panelKeyUsage === undefined || panelKeyUsage.length === 0) {
          delete draft.panels[panelKey];
        }
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
