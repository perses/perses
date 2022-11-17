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

import { PanelDefinition, UnknownSpec } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';
import { generateId, Middleware } from './common';
import {
  PanelGroupSlice,
  PanelGroupItemId,
  PanelGroupId,
  PanelGroupDefinition,
  PanelGroupItemLayout,
  addPanelGroup,
  createEmptyPanelGroup,
} from './panel-group-slice';
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
      const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;
      const panelKey = panelGroups[panelGroupId]?.itemPanelKeys[panelGroupLayoutId];
      if (panelKey === undefined) {
        throw new Error(`Could not find Panel Group item ${panelGroupItemId}`);
      }

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
          set((state) => {
            state.panels[panelKey] = panelDefinititon;

            // If the panel didn't change groups, nothing else to do
            if (next.groupId === panelGroupId) {
              return;
            }

            // Move panel to the new group
            const existingGroup = state.panelGroups[panelGroupId];
            if (existingGroup === undefined) {
              throw new Error(`Missing panel group ${panelGroupId}`);
            }

            const existingLayoutIdx = existingGroup.itemLayouts.findIndex((layout) => layout.i === panelGroupLayoutId);
            const existingLayout = existingGroup.itemLayouts[existingLayoutIdx];
            const existingPanelKey = existingGroup.itemPanelKeys[panelGroupLayoutId];
            if (existingLayoutIdx === -1 || existingLayout === undefined || existingPanelKey === undefined) {
              throw new Error(`Missing panel group item ${panelGroupLayoutId}`);
            }

            // Remove item from the old group
            existingGroup.itemLayouts.splice(existingLayoutIdx, 1);
            delete existingGroup.itemPanelKeys[panelGroupLayoutId];

            // Add item to the end of the new group
            const newGroup = state.panelGroups[next.groupId];
            if (newGroup === undefined) {
              throw new Error(`Could not find new group ${next.groupId}`);
            }

            newGroup.itemLayouts.push({
              i: existingLayout.i,
              x: 0,
              y: getYForNewRow(newGroup),
              w: existingLayout.w,
              h: existingLayout.h,
            });
            newGroup.itemPanelKeys[existingLayout.i] = existingPanelKey;
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
      // If a panel group isn't supplied, add to the first group or create a group if there aren't any
      let newGroup: PanelGroupDefinition | undefined = undefined;
      panelGroupId ??= get().panelGroupOrder[0];
      if (panelGroupId === undefined) {
        newGroup = createEmptyPanelGroup();
        newGroup.title = 'Panel Group';
        panelGroupId = newGroup.id;
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
          const uniquePanelKeys = getUniquePanelKeys(get().panels);
          let panelKey = removeWhiteSpacesAndSpecialCharacters(next.name);
          // append count if panel key already exists
          if (uniquePanelKeys[panelKey]) {
            panelKey += `-${uniquePanelKeys[panelKey]}`;
          }
          set((state) => {
            // Add a panel
            state.panels[panelKey] = panelDef;

            // Also add a panel group item referencing the panel
            const group = state.panelGroups[next.groupId];
            if (group === undefined) {
              throw new Error(`Missing panel group ${next.groupId}`);
            }
            const layout: PanelGroupItemLayout = {
              i: generateId().toString(),
              x: 0,
              y: getYForNewRow(group),
              w: 12,
              h: 6,
            };
            group.itemLayouts.push(layout);
            group.itemPanelKeys[layout.i] = panelKey;
          });
        },
        close: () => {
          set((state) => {
            state.panelEditor = undefined;
          });
        },
      };

      set((state) => {
        // Add the new panel group if one was created for the panel
        if (newGroup !== undefined) {
          addPanelGroup(state, newGroup);
        }

        // Open the editor with the new state
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
  for (const layout of group.itemLayouts) {
    const itemMaxY = layout.y + layout.h;
    if (itemMaxY > newRowY) {
      newRowY = itemMaxY;
    }
  }
  return newRowY;
}

// Find all the unique panel keys
// ex: cpu, cpu-1, cpu-2 count as the same panel key since these panels have the same name
function getUniquePanelKeys(panels: Record<string, PanelDefinition>): Record<string, number> {
  const uniquePanelKeys: Record<string, number> = {};
  Object.keys(panels).forEach((panelKey) => {
    const key = panelKey.replace(/-([0-9]+)/, '');
    const count = uniquePanelKeys[key];
    if (count) {
      uniquePanelKeys[key] = count + 1;
    } else {
      uniquePanelKeys[key] = 1;
    }
  });
  return uniquePanelKeys;
}
