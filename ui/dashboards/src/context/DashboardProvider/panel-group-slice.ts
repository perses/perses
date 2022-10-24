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

import { GridItemDefinition, LayoutDefinition } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';

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
  panelGroupOrder: PanelGroupId[];

  /**
   * previous state
   */
  previousPanelGroupState: {
    panelGroups: PanelGroupSlice['panelGroups'];
    panelGroupIdOrder: PanelGroupSlice['panelGroupOrder'];
  };

  // TODO: Remove this
  createPanelGroupId: () => PanelGroupId;

  /**
   * Rearrange the order of panel groups by swapping the positions
   */
  swapPanelGroups: (xIndex: number, yIndex: number) => void;

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
): StateCreator<PanelGroupSlice, Middleware, [], PanelGroupSlice> {
  // Helper function for generating unique IDs for a PanelGroup
  let id: PanelGroupId = -1;
  function createPanelGroupId(): PanelGroupId {
    id++;
    return id;
  }

  // Convert the initial layouts from the JSON to panel groups and keep track of the order
  const panelGroups: PanelGroupSlice['panelGroups'] = {};
  const panelGroupIdOrder: PanelGroupSlice['panelGroupOrder'] = [];
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
  return (set) => ({
    panelGroups,
    panelGroupOrder: panelGroupIdOrder,

    previousPanelGroupState: { panelGroups, panelGroupIdOrder },

    // TODO: Reorder init logic so this isn't exposed
    createPanelGroupId,

    savePanelGroups() {
      set((state) => {
        state.previousPanelGroupState = {
          panelGroups: state.panelGroups,
          panelGroupIdOrder: state.panelGroupOrder,
        };
      });
    },

    resetPanelGroups() {
      set((state) => {
        state.panelGroups = state.previousPanelGroupState.panelGroups;
        state.panelGroupOrder = state.previousPanelGroupState.panelGroupIdOrder;
      });
    },

    swapPanelGroups(x, y) {
      set((state) => {
        if (x < 0 || x >= state.panelGroupOrder.length || y < 0 || y >= state.panelGroupOrder.length) {
          throw new Error('index out of bound');
        }
        const xPanelGroup = state.panelGroupOrder[x];
        const yPanelGroup = state.panelGroupOrder[y];

        if (xPanelGroup === undefined || yPanelGroup === undefined) {
          throw new Error('panel group is undefined');
        }
        // assign yPanelGroup to layouts[x] and assign xGroup to layouts[y], swapping two panel groups
        [state.panelGroupOrder[x], state.panelGroupOrder[y]] = [yPanelGroup, xPanelGroup];
      });
    },
  });
}
