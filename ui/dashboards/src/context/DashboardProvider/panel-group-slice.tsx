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
import { WritableDraft } from 'immer/dist/internal';
import { StateCreator } from 'zustand';
import { Middleware } from './common';
import { PanelEditorSlice } from './panel-editor-slice';

/**
 * Slice with the state of Panel Groups, as well as any actions that modify only Panel Group state.
 */
export interface PanelGroupSlice {
  /**
   * Panel groups indexed by their ID.
   */
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>;

  /**
   * An array of panel group IDs, representing their order in the dashboard.
   */
  panelGroupIdOrder: PanelGroupId[];

  /**
   * previous state
   */
  previousPanelGroupStates: {
    panelGroups: PanelGroupSlice['panelGroups'];
    panelGroupIdOrder: PanelGroupSlice['panelGroupIdOrder'];
  };

  // TODO: Remove this
  createPanelGroupId: () => PanelGroupId;

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

  /**
   * save
   */
  savePanelGroups: () => void;

  /**
   * reset to previous panel group states
   */
  resetPanelGroups: () => void;
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
 * Curried function for creating a PanelGroupSlice.
 */
export function createPanelGroupSlice(
  layouts: LayoutDefinition[]
): StateCreator<PanelGroupSlice & PanelEditorSlice, Middleware, [], PanelGroupSlice> {
  // Helper function for generating unique IDs for a PanelGroup
  let id: PanelGroupId = -1;
  function createPanelGroupId(): PanelGroupId {
    id++;
    return id;
  }

  // Convert the initial layouts from the JSON to panel groups and keep track of the order
  const panelGroups: PanelGroupSlice['panelGroups'] = {};
  const panelGroupIdOrder: PanelGroupSlice['panelGroupIdOrder'] = [];
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

    previousPanelGroupStates: { panelGroups, panelGroupIdOrder },

    // TODO: Reorder init logic so this isn't exposed
    createPanelGroupId,

    savePanelGroups() {
      set((state) => {
        state.previousPanelGroupStates = {
          panelGroups: state.panelGroups,
          panelGroupIdOrder: state.panelGroupIdOrder,
        };
      });
    },

    resetPanelGroups() {
      set((state) => {
        state.panelGroups = state.previousPanelGroupStates.panelGroups;
        state.panelGroupIdOrder = state.previousPanelGroupStates.panelGroupIdOrder;
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

/**
 * Helper to move an item in a PanelGroup from one group to another on the given immer draft state.
 */
export function movePanelGroupItem(
  draft: WritableDraft<PanelGroupSlice>,
  panelGroupItemId: PanelGroupItemId,
  newPanelGroupId: PanelGroupId
) {
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
  const newGroup = draft.panelGroups[newPanelGroupId];
  if (newGroup === undefined) {
    throw new Error(`Could not find new group ${newPanelGroupId}`);
  }
  newGroup.items.push({
    x: 0,
    y: getYForNewRow(newGroup),
    width: existingItem.width,
    height: existingItem.height,
    content: existingItem.content,
  });
}

/**
 * Helper function to add a panel group item to a panel group on the given immer draft state.
 */
export function addPanelGroupItem(draft: WritableDraft<PanelGroupSlice>, panelKey: string, panelGroupId: PanelGroupId) {
  const group = draft.panelGroups[panelGroupId];
  if (group === undefined) {
    throw new Error(`Missing panel group ${panelGroupId}`);
  }
  const gridItem: GridItemDefinition = {
    x: 0,
    y: getYForNewRow(group),
    width: 12,
    height: 6,
    content: createPanelRef(panelKey),
  };
  group.items.push(gridItem);
}

/**
 * Helper to get the panel key for an item in a PanelGroup.
 */
export function getPanelKey(panelGroups: PanelGroupSlice['panelGroups'], panelGroupItemId: PanelGroupItemId) {
  const { panelGroupId, itemIndex } = panelGroupItemId;
  const group = findGroup(panelGroups, panelGroupId);
  const item = findItem(group, itemIndex);
  return getPanelKeyFromRef(item.content);
}

// Helper to find a group and throw if not found
function findGroup(panelGroups: PanelGroupSlice['panelGroups'], groupId: PanelGroupId) {
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
