// Copyright 2023 The Perses Authors
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
import { getYForNewRow, getValidPanelKey } from '../../utils/panelUtils';
import { generateId, Middleware } from './common';
import { PanelGroupSlice, PanelGroupItemId, PanelGroupItemLayout } from './panel-group-slice';
import { PanelSlice } from './panel-slice';

/**
 * Slice that handles duplicating Panels.
 */
export interface DuplicatePanelSlice {
  /**
   * Duplicate panel.
   */
  duplicatePanel: (panelGroupItemId: PanelGroupItemId) => void;
}

/**
 * Curried function for duplicating a panel.
 */
export function createDuplicatePanelSlice(): StateCreator<
  // Actions in here need to modify both Panels and Panel Groups state
  DuplicatePanelSlice & PanelSlice & PanelGroupSlice,
  Middleware,
  [],
  DuplicatePanelSlice
> {
  return (set) => ({
    duplicatePanel(panelGroupItemId: PanelGroupItemId) {
      set((state) => {
        const panels = state.panels;

        // Figure out the panel key at that location
        const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;
        const group = state.panelGroups[panelGroupId];
        if (group === undefined) {
          throw new Error(`Missing panel group ${panelGroupId}`);
        }
        const panelKey = group.itemPanelKeys[panelGroupLayoutId];
        if (panelKey === undefined) {
          throw new Error(`Could not find Panel Group item ${panelGroupItemId}`);
        }

        // Find the panel to edit
        const panelToDupe = panels[panelKey];
        if (panelToDupe === undefined) {
          throw new Error(`Cannot find Panel with key '${panelKey}'`);
        }

        // Find the layout for the item being duped
        const matchingLayout = group.itemLayouts.find((itemLayout) => {
          return itemLayout.i === panelGroupLayoutId;
        });

        if (matchingLayout === undefined) {
          throw new Error(`Cannot find layout for Panel with key '${panelKey}'`);
        }

        const dupePanelKey = getValidPanelKey(panelKey, panels);

        state.panels[dupePanelKey] = panelToDupe;

        const layout: PanelGroupItemLayout = {
          i: generateId().toString(),
          x: 0,
          y: getYForNewRow(group),
          w: matchingLayout.w,
          h: matchingLayout.h,
        };
        group.itemLayouts.push(layout);
        group.itemPanelKeys[layout.i] = dupePanelKey;
      });
    },
  });
}
