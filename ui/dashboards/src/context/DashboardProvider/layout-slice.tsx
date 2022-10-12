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
import { PanelEditorSlice } from './panel-editing-slice';

export interface LayoutSlice {
  /**
   * Panel groups indexed by their ID.
   */
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>;

  /**
   * An array of panel group IDs, representing their order in the dashboard.
   */
  panelGroupIdOrder: PanelGroupId[];

  /**
   * Given a LayoutItem location, returns the panel's unique key at that location.
   */
  getPanelKey: (layoutItem: PanelGroupItemId) => string;

  /**
   * Add a panel with the specified key to an existing group.
   */
  addPanelToGroup: (panelKey: string, panelGroupId: PanelGroupId) => void;

  /**
   * Move an existing Panel to a new panel group.
   */
  movePanelToGroup: (layoutItem: PanelGroupItemId, newPanelGroupId: PanelGroupId) => void;

  /**
   * Updates an existing panel group to, for example, change its display properties.
   */
  updatePanelGroup: (panelGroup: Omit<PanelGroupDefinition, 'id'>, panelGroupId?: PanelGroupId) => void;

  /**
   * Rearrange the order of panel groups by swapping the positions
   */
  swapPanelGroups: (xIndex: number, yIndex: number) => void;

  /**
   * Delete panel group and all the panels within the group
   */
  deletePanelGroup: (panelGroupId: PanelGroupId) => void;

  /**
   * Delete panel in panel group
   */
  deletePanelInPanelGroup: (layoutItem: PanelGroupItemId) => void;

  /**
   * Map panel to panel groups
   */
  mapPanelToPanelGroups: () => Record<string, PanelGroupId[]>;
}

export type PanelGroupId = number;

export interface PanelGroupDefinition {
  id: PanelGroupId;
  items: GridItemDefinition[];
  isCollapsed: boolean;
  title?: string;
}

/**
 * Uniquely identifies an item in a PanelGroup.
 */
export interface PanelGroupItemId {
  panelGroupId: PanelGroupId;
  itemIndex: number;
}

/**
 * Curried function for creating a LayoutEditorSlice.
 */
export function createLayoutSlice(
  layouts: LayoutDefinition[]
): StateCreator<LayoutSlice & PanelEditorSlice, Middleware, [], LayoutSlice> {
  // Helper function for generating unique IDs for a PanelGroup
  let id: PanelGroupId = -1;
  function createPanelGroupId(): PanelGroupId {
    id++;
    return id;
  }

  // Convert the initial layouts from the JSON to panel groups and keep track of the order
  const panelGroups: LayoutSlice['panelGroups'] = {};
  const panelGroupIdOrder: LayoutSlice['panelGroupIdOrder'] = [];
  for (const layout of layouts) {
    const id = createPanelGroupId();
    panelGroups[id] = {
      id,
      items: layout.spec.items,
      isCollapsed: layout.spec.display?.collapse?.open === false,
      title: layout.spec.display?.title,
    };
    panelGroupIdOrder.push(id);
  }

  // Return the state creator function for Zustand
  return (set, get) => ({
    panelGroups,
    panelGroupIdOrder,

    getPanelKey({ panelGroupId, itemIndex }) {
      const { panelGroups } = get();
      const group = findGroup(panelGroups, panelGroupId);
      const item = findItem(group, itemIndex);
      return getPanelKeyFromRef(item.content);
    },

    addPanelToGroup(panelKey, panelGroupId) {
      const { panelGroups } = get();
      const group = findGroup(panelGroups, panelGroupId);
      const gridItem: GridItemDefinition = {
        x: 0,
        y: getYForNewRow(group),
        width: 12,
        height: 6,
        content: createPanelRef(panelKey),
      };
      set((state) => {
        state.panelGroups[panelGroupId]?.items.push(gridItem);
      });
    },

    movePanelToGroup({ panelGroupId, itemIndex }, newPanelGroupId) {
      const { panelGroups } = get();

      // Find the existing item to make sure it exists
      const group = findGroup(panelGroups, panelGroupId);
      const item = findItem(group, itemIndex);

      // Find the new group and figure out where a new row should go
      const newGroup = findGroup(panelGroups, newPanelGroupId);
      const newGroupY = getYForNewRow(newGroup);

      set((state) => {
        // Remove the item from its current group
        state.panelGroups[panelGroupId]?.items.splice(itemIndex, 1);

        // Add a new item to the new group
        state.panelGroups[newPanelGroupId]?.items.push({
          x: 0,
          y: newGroupY,
          width: item.width,
          height: item.height,
          content: item.content,
        });
      });
    },

    // TODO: Maybe combine this into some kind of groupEditor state
    updatePanelGroup(panelGroup, panelGroupId) {
      set((state) => {
        // Adding a new panel group?
        if (panelGroupId === undefined) {
          const id = createPanelGroupId();
          const newPanelGroup = { ...panelGroup, id };
          state.panelGroups[id] = newPanelGroup;
          state.panelGroupIdOrder.unshift(id);
          return;
        }

        const existingGroup = state.panelGroups[panelGroupId];
        if (existingGroup === undefined) {
          throw new Error(`Cannot find panel group with Id ${panelGroupId} to update`);
        }
        state.panelGroups[panelGroupId] = { ...panelGroup, id: panelGroupId };
      });
    },

    swapPanelGroups(x, y) {
      set((state) => {
        if (x < 0 || x >= state.panelGroupIdOrder.length || y < 0 || y >= state.panelGroupIdOrder.length) {
          throw new Error('index out of bound');
        }
        const xPanelGroup = state.panelGroupIdOrder[x];
        const yPanelGroup = state.panelGroupIdOrder[y];

        if (xPanelGroup === undefined || yPanelGroup === undefined) {
          throw new Error('panel group is undefined');
        }
        // assign yPanelGroup to layouts[x] and assign xGroup to layouts[y], swapping two panel groups
        [state.panelGroupIdOrder[x], state.panelGroupIdOrder[y]] = [yPanelGroup, xPanelGroup];
      });
    },

    deletePanelInPanelGroup({ panelGroupId, itemIndex }) {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined) {
          throw new Error(`No panel group found: ${panelGroupId}`);
        }
        // remove panel from panel group
        group.items.splice(itemIndex, 1);
      });
    },

    deletePanelGroup(panelGroupId) {
      const { panelGroups, panelGroupIdOrder: panelGroupOrder, deletePanels } = get();
      const group = findGroup(panelGroups, panelGroupId);
      const orderIdx = panelGroupOrder.findIndex((id) => id === panelGroupId);
      if (orderIdx === -1) {
        throw new Error(`Could not find panel group Id ${panelGroupId} in order array`);
      }

      // remove panels from group first
      const panelsToBeDeleted: PanelGroupItemId[] = [];
      for (let i = 0; i < group.items.length; i++) {
        panelsToBeDeleted.push({ panelGroupId, itemIndex: i });
      }
      deletePanels(panelsToBeDeleted);

      // remove group from both panelGroups and panelGroupOrder
      set((state) => {
        state.panelGroupIdOrder.splice(orderIdx, 1);
        delete state.panelGroups[panelGroupId];
      });
    },

    // Return an object that maps each panel to the groups it belongs
    mapPanelToPanelGroups() {
      const map: Record<string, Array<PanelGroupDefinition['id']>> = {}; // { panel key: [group ids] }
      Object.values(get().panelGroups).forEach((group) => {
        // for each panel in a group, add the group id to map[panelKey]
        group.items.forEach((panel) => {
          const panelKey = getPanelKeyFromRef(panel.content);
          if (map[panelKey]) {
            map[panelKey]?.push(group.id);
          } else {
            map[panelKey] = [group.id];
          }
        });
      });
      return map;
    },
  });
}

// Helper to find a group and throw if not found
function findGroup(panelGroups: LayoutSlice['panelGroups'], groupId: PanelGroupId) {
  const group = panelGroups[groupId];
  if (group === undefined) {
    throw new Error(`No panel group found for Id ${groupId}`);
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
