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

import { PanelDefinition } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { removeWhiteSpacesAndSpecialCharacters } from '../../utils/functions';
import { Middleware } from './common';
import { LayoutEditorSlice, LayoutItem } from './layout-editing';

export interface PanelEditorSlice {
  panels: Record<string, PanelDefinition>;
  /**
   * State for the panel editor when its open, otherwise undefined when it's closed.
   */
  panelEditor?: PanelEditorState;

  /**
   * Edit an existing panel by providing its layout coordinates.
   */
  editPanel: (item: LayoutItem) => void;

  /**
   * Add a new Panel to a panel group.
   */
  addPanel: (initialGroup: number) => void;
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
  groupIndex: number;
  kind: string;
  spec: unknown;
}

/**
 * Curried function for creating the PanelEditorSlice.
 */
export function createPanelEditorSlice(
  panels: PanelEditorSlice['panels']
): StateCreator<PanelEditorSlice & LayoutEditorSlice, Middleware, [], PanelEditorSlice> {
  // Return the state creator function for Zustand that uses the panels provided as intitial state
  return (set, get) => ({
    panels,

    panelEditor: undefined,

    editPanel(item) {
      const { panels, getPanelKey } = get();

      // Ask the layout store for the panel key at that location
      const panelKey = getPanelKey(item);

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
          groupIndex: item.groupIndex,
          kind: panelToEdit.spec.plugin.kind,
          spec: panelToEdit.spec.plugin.spec,
        },
        applyChanges: (next) => {
          const panelDefinititon = createPanelDefinitionFromEditorValues(next);
          set((state) => {
            state.panels[panelKey] = panelDefinititon;
          });

          // Move the panel to another group if it changed
          if (next.groupIndex !== item.groupIndex) {
            get().movePanelToGroup(item, next.groupIndex);
          }
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

    addPanel(initialGroup) {
      const editorState: PanelEditorState = {
        mode: 'Add',
        initialValues: {
          name: '',
          description: '',
          groupIndex: initialGroup,
          // TODO: If we knew what plugins were available (and how to create the initial spec), we might be able to
          // set a smarter default here?
          kind: '',
          spec: {},
        },
        applyChanges: (next) => {
          const panelDef = createPanelDefinitionFromEditorValues(next);
          const panelKey = removeWhiteSpacesAndSpecialCharacters(next.name);
          set((state) => {
            state.panels[panelKey] = panelDef;
          });
          get().addPanelToGroup(panelKey, next.groupIndex);
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
