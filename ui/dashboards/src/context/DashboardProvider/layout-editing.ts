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

import {
  createPanelRef,
  getPanelKeyFromRef,
  GridDefinition,
  GridItemDefinition,
  LayoutDefinition,
} from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';

export interface LayoutEditorSlice {
  layouts: LayoutDefinition[];

  /**
   * Given a LayoutItem location, returns the panel's unique key at that location.
   */
  getPanelKey: (layoutItem: LayoutItem) => string;

  /**
   * Add a panel with the specified key to an existing group.
   */
  addPanelToGroup: (panelKey: string, groupIndex: number) => void;

  /**
   * Move an existing Panel to a new panel group.
   */
  movePanelToGroup: (layoutItem: LayoutItem, newGroupIndex: number) => void;

  /**
   * Updates an existing panel group to, for example, change its display properties.
   */
  updatePanelGroup: (layout: LayoutDefinition, index?: number) => void;
}

/**
 * The location of an item (e.g. a Panel) in layouts.
 */
export interface LayoutItem {
  groupIndex: number;
  itemIndex: number;
}

/**
 * Curried function for creating a LayoutEditorSlice.
 */
export function createLayoutEditorSlice(
  layouts: LayoutDefinition[]
): StateCreator<LayoutEditorSlice, Middleware, [], LayoutEditorSlice> {
  // Return the state creator function for Zustand that uses the layouts provided as initial state
  return (set, get) => ({
    layouts,

    getPanelKey({ groupIndex, itemIndex }) {
      const { layouts } = get();
      const group = findGroup(layouts, groupIndex);
      const item = findItem(group, itemIndex);
      return getPanelKeyFromRef(item.content);
    },

    addPanelToGroup(panelKey, groupIndex) {
      const { layouts } = get();
      const group = findGroup(layouts, groupIndex);
      const gridItem: GridItemDefinition = {
        x: 0,
        y: getYForNewRow(group),
        width: 12,
        height: 6,
        content: createPanelRef(panelKey),
      };
      set((state) => {
        state.layouts[groupIndex]?.spec.items.push(gridItem);
      });
    },

    movePanelToGroup({ groupIndex, itemIndex }, newGroupIndex) {
      const { layouts } = get();

      // Find the existing item to make sure it exists
      const group = findGroup(layouts, groupIndex);
      const item = findItem(group, itemIndex);

      // Find the new group and figure out where a new row should go
      const newGroup = findGroup(layouts, newGroupIndex);
      const newGroupY = getYForNewRow(newGroup);

      set((state) => {
        // Remove the item from its current group
        state.layouts[groupIndex]?.spec.items.splice(itemIndex);

        // Add a new item to the new group
        state.layouts[newGroupIndex]?.spec.items.push({
          x: 0,
          y: newGroupY,
          width: item.width,
          height: item.height,
          content: item.content,
        });
      });
    },

    // TODO: Maybe combine this into some kind of groupEditor state
    updatePanelGroup(next, groupIndex) {
      set((state) => {
        if (groupIndex === undefined) {
          state.layouts.unshift(next);
        } else {
          state.layouts[groupIndex] = next;
        }
      });
    },
  });
}

// Helper to find a group and throw if not found
function findGroup(layouts: LayoutDefinition[], groupIndex: number) {
  const group = layouts[groupIndex];
  if (group === undefined) {
    throw new Error(`No layout at index ${groupIndex}`);
  }
  return group;
}

// Helper to get an item in a group and throw if not found
function findItem(group: GridDefinition, itemIndex: number) {
  const item = group.spec.items[itemIndex];
  if (item === undefined) {
    throw new Error(`No grid item found at position ${itemIndex}`);
  }
  return item;
}

// Given a Grid, will find the Y coordinate for adding a new row to the grid, taking into account the items present
function getYForNewRow(grid: GridDefinition) {
  let newRowY = 0;
  for (const item of grid.spec.items) {
    const itemMaxY = item.y + item.height;
    if (itemMaxY > newRowY) {
      newRowY = itemMaxY;
    }
  }
  return newRowY;
}
