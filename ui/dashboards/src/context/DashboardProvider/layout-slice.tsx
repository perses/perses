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

import { createPanelRef, getPanelKeyFromRef, GridItemDefinition, LayoutDefinition } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';

export interface LayoutSlice {
  layouts: PanelGroupDefinition[];

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
  updatePanelGroup: (layout: Omit<PanelGroupDefinition, 'id'>, groupIndex?: number) => void;

  /**
   * Rearrange the order of panel groups by swapping the positions
   */
  swapPanelGroups: (xIndex: number, yIndex: number) => void;
}

export interface PanelGroupDefinition {
  id: number;
  items: GridItemDefinition[];
  isCollapsed?: boolean;
  title?: string;
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
export function createLayoutSlice(layouts: LayoutDefinition[]): StateCreator<LayoutSlice, Middleware, [], LayoutSlice> {
  // Return the state creator function for Zustand that uses the layouts provided as initial state
  let id = -1;

  function createPanelGroupId() {
    id++;
    return id;
  }

  return (set, get) => ({
    layouts: layouts.map((layout) => ({
      ...layout,
      id: createPanelGroupId(),
      title: layout.spec.display?.title,
      isCollapsed: !layout.spec.display?.collapse?.open ?? false,
      items: layout.spec.items,
    })),

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
        state.layouts[groupIndex]?.items.push(gridItem);
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
        state.layouts[groupIndex]?.items.splice(itemIndex, 1);

        // Add a new item to the new group
        state.layouts[newGroupIndex]?.items.push({
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
          state.layouts.unshift({ ...next, id: createPanelGroupId() });
        } else {
          const layout = state.layouts[groupIndex];
          if (layout === undefined) {
            throw new Error(`No layout at index ${groupIndex}`);
          }
          state.layouts[groupIndex] = { ...next, id: layout.id };
        }
      });
    },

    swapPanelGroups(x, y) {
      set((state) => {
        if (x < 0 || x >= state.layouts.length || y < 0 || y >= state.layouts.length) {
          throw new Error('index out of bound');
        }
        const xPanelGroup = state.layouts[x];
        const yPanelGroup = state.layouts[y];

        if (xPanelGroup === undefined || yPanelGroup === undefined) {
          throw new Error('panel group is undefined');
        }
        // assign yPanelGroup to layouts[x] and assign xGroup to layouts[y], swapping two panel groups
        [state.layouts[x], state.layouts[y]] = [yPanelGroup, xPanelGroup];
      });
    },
  });
}

// Helper to find a group and throw if not found
function findGroup(layouts: PanelGroupDefinition[], groupIndex: number) {
  const group = layouts[groupIndex];
  if (group === undefined) {
    throw new Error(`No layout at index ${groupIndex}`);
  }
  return group;
}

// Helper to get an item in a group and throw if not found
function findItem(group: PanelGroupDefinition, itemIndex: number) {
  const item = group.items[itemIndex];
  if (item === undefined) {
    throw new Error(`No grid item found at position ${itemIndex}`);
  }
  return item;
}

// Given a Grid, will find the Y coordinate for adding a new row to the grid, taking into account the items present
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
