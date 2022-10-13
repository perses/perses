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
import { LayoutSlice, PanelGroupDefinition, PanelGroupId } from './layout-slice';

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

export interface PanelGroupSlice {
  /**
   * State that's present when the panel group editor is open.
   */
  panelGroupEditor?: PanelGroupEditor;

  /**
   * Opens the panel group editor to add a new panel group.
   */
  addPanelGroup: () => void;

  /**
   * Opens the panel group editor to edit an existing panel group.
   */
  editPanelGroup: (panelGroupId: PanelGroupId) => void;

  deletePanelGroupDialog?: DeletePanelGroupDialog;
  openDeletePanelGroupDialog: (panelGroupId: PanelGroupId) => void;
  closeDeletePanelGroupDialog: () => void;
}

export const createPanelGroupSlice: StateCreator<PanelGroupSlice & LayoutSlice, Middleware, [], PanelGroupSlice> = (
  set,
  get
) => ({
  panelGroupEditor: undefined,

  addPanelGroup: () => {
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

  editPanelGroup: (panelGroupId) => {
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
