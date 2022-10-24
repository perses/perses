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

import { createPanelRef, getPanelKeyFromRef, GridItemDefinition, PanelDefinition, UnknownSpec } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';
import { Middleware } from './common';
import { PanelGroupSlice, PanelGroupItemId, PanelGroupId, PanelGroupDefinition } from './panel-group-slice';
import { PanelSlice } from './panel-slice';

/**
 * Slice that handles the visual editor state and actions for adding or editing Panels.
 */
export interface PanelEditorSlice {
  /**
   * State for the panel editor when its open, otherwise undefined when it's closed.
   */
  panelEditor?: PanelEditorState;

  /**
   * Opens the editor for editing an existing panel by providing its layout coordinates.
   */
  openEditPanel: (panelGroupItemId: PanelGroupItemId) => void;

  /**
   * Opens the editor for adding a new Panel to a panel group.
   */
  openAddPanel: (panelGroupId?: PanelGroupId) => void;
}

export interface PanelEditorState {
  /**
   * Whether we're adding a new panel, or editing an existing panel.
   */
  mode: 'Add' | 'Edit';

  /**
   * Initial values for the things that can be edited about a panel.
   */
  initialValues: PanelEditorValues;

  /**
   * Applies changes, but doesn't close the editor.
   */
  applyChanges: (next: PanelEditorValues) => void;

  /**
   * Close the editor.
   */
  close: () => void;
}

/**
 * Panel values that can be edited in the panel editor.
 */
export interface PanelEditorValues {
  name: string;
  description: string;
  groupId: PanelGroupId;
  kind: string;
  spec: UnknownSpec;
}

/**
 * Curried function for creating the PanelEditorSlice.
 */
export function createPanelEditorSlice(): StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  PanelEditorSlice & PanelSlice & PanelGroupSlice,
  Middleware,
  [],
  PanelEditorSlice
> {
  // Return the state creator function for Zustand that uses the panels provided as intitial state
  return (set, get) => ({
    panelEditor: undefined,

    openEditPanel(panelGroupItemId) {
      const { panels, panelGroups } = get();

      // Figure out the panel key at that location
      const { panelGroupId, itemIndex } = panelGroupItemId;
      const content = panelGroups[panelGroupId]?.items[itemIndex]?.content;
      if (content === undefined) {
        throw new Error(`Could not find Panel Group item ${panelGroupItemId}`);
      }
      const panelKey = getPanelKeyFromRef(content);

      // Find the panel to edit
      const panelToEdit = panels[panelKey];
      if (panelToEdit === undefined) {
        throw new Error(`Cannot find Panel with key '${panelKey}'`);
      }

      const editorState: PanelEditorState = {
        mode: 'Edit',
        initialValues: {
          name: panelToEdit.spec.display.name,
          description: panelToEdit.spec.display.description ?? '',
          groupId: panelGroupItemId.panelGroupId,
          kind: panelToEdit.spec.plugin.kind,
          spec: panelToEdit.spec.plugin.spec,
        },
        applyChanges: (next) => {
          const panelDefinititon = createPanelDefinitionFromEditorValues(next);
          set((draft) => {
            draft.panels[panelKey] = panelDefinititon;

            // If the panel didn't change groups, nothing else to do
            if (next.groupId === panelGroupItemId.panelGroupId) {
              return;
            }

            // Move panel to the new group
            const existingGroup = draft.panelGroups[panelGroupItemId.panelGroupId];
            if (existingGroup === undefined) {
              throw new Error(`Missing panel group ${panelGroupItemId.panelGroupId}`);
            }
            const existingItem = existingGroup.items[panelGroupItemId.itemIndex];
            if (existingItem === undefined) {
              throw new Error(`Missing panel group item ${panelGroupItemId.itemIndex}`);
            }

            // Remove item from the old group
            existingGroup.items.splice(panelGroupItemId.itemIndex, 1);

            // Add item to the end of the new group
            const newGroup = draft.panelGroups[next.groupId];
            if (newGroup === undefined) {
              throw new Error(`Could not find new group ${next.groupId}`);
            }
            newGroup.items.push({
              x: 0,
              y: getYForNewRow(newGroup),
              width: existingItem.width,
              height: existingItem.height,
              content: existingItem.content,
            });
          });
        },
        close: () => {
          set((state) => {
            state.panelEditor = undefined;
          });
        },
      };

      // Open the editor with the new state
      set((state) => {
        state.panelEditor = editorState;
      });
    },

    openAddPanel(panelGroupId) {
      // If a panel group isn't supplied, add to the first group
      if (panelGroupId === undefined) {
        const firstGroupId = get().panelGroupIdOrder[0];
        if (firstGroupId === undefined) {
          throw new Error('No panel groups to add a panel to');
        }
        panelGroupId = firstGroupId;
      }

      const editorState: PanelEditorState = {
        mode: 'Add',
        initialValues: {
          name: '',
          description: '',
          groupId: panelGroupId,
          // TODO: If we knew what plugins were available (and how to create the initial spec), we might be able to
          // set a smarter default here?
          kind: '',
          spec: {},
        },
        applyChanges: (next) => {
          const panelDef = createPanelDefinitionFromEditorValues(next);
          const panelKey = removeWhiteSpacesAndSpecialCharacters(next.name);
          set((draft) => {
            // Add a panel
            draft.panels[panelKey] = panelDef;

            // Also add a panel group item referencing the panel
            const group = draft.panelGroups[next.groupId];
            if (group === undefined) {
              throw new Error(`Missing panel group ${next.groupId}`);
            }
            const gridItem: GridItemDefinition = {
              x: 0,
              y: getYForNewRow(group),
              width: 12,
              height: 6,
              content: createPanelRef(panelKey),
            };
            group.items.push(gridItem);
          });
        },
        close: () => {
          set((state) => {
            state.panelEditor = undefined;
          });
        },
      };

      // Open the editor with the new state
      set((state) => {
        state.panelEditor = editorState;
      });
    },
  });
}

// Helper to create PanelDefinitions when saving
function createPanelDefinitionFromEditorValues(editorValues: PanelEditorValues): PanelDefinition {
  return {
    kind: 'Panel',
    spec: {
      display: {
        name: editorValues.name,
        description: editorValues.description !== '' ? editorValues.description : undefined,
      },
      plugin: {
        kind: editorValues.kind,
        spec: editorValues.spec,
      },
    },
  };
}

// Given a PanelGroup, will find the Y coordinate for adding a new row to the grid, taking into account the items present
function getYForNewRow(group: PanelGroupDefinition) {
  let newRowY = 0;
  for (const item of group.items) {
    const itemMaxY = item.y + item.height;
    if (itemMaxY > newRowY) {
      newRowY = itemMaxY;
    }
  }
  return newRowY;
}
