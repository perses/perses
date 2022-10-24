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

import { getPanelKeyFromRef, LayoutDefinition } from '@perses-dev/core';
import { Layout } from 'react-grid-layout';
import { StateCreator } from 'zustand';
import { generateId, Middleware } from './common';

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

  /**
   * Rearrange the order of panel groups by swapping the positions
   */
  swapPanelGroups: (xIndex: number, yIndex: number) => void;

  /**
   * Update the item layouts for a panel group when, for example, a panel is moved or resized.
   */
  updatePanelGroupLayouts: (panelGroupId: PanelGroupId, itemLayouts: PanelGroupDefinition['itemLayouts']) => void;

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
  isCollapsed: boolean;
  title?: string;
  itemLayouts: PanelGroupLayout[];
  itemPanelKeys: Record<PanelGroupLayoutId, string>;
}

export interface PanelGroupLayout extends Layout {
  i: PanelGroupLayoutId;
}

export type PanelGroupLayoutId = string;

/**
 * Uniquely identifies an item in a PanelGroup.
 */
export interface PanelGroupItemId {
  panelGroupId: PanelGroupId;
  panelGroupLayoutId: PanelGroupLayoutId;
}

/**
 * Curried function for creating a PanelGroupSlice.
 */
export function createPanelGroupSlice(
  layouts: LayoutDefinition[]
): StateCreator<PanelGroupSlice, Middleware, [], PanelGroupSlice> {
  // Convert the initial layouts from the JSON
  const panelGroups: PanelGroupSlice['panelGroups'] = {};
  const panelGroupIdOrder: PanelGroupSlice['panelGroupOrder'] = [];
  for (const layout of layouts) {
    const itemLayouts: PanelGroupDefinition['itemLayouts'] = [];
    const itemPanelKeys: PanelGroupDefinition['itemPanelKeys'] = {};

    // Split layout information from panel keys to make it easier to update just layouts on move/resize of panels
    for (const item of layout.spec.items) {
      const panelGroupLayoutId = generateId().toString();
      itemLayouts.push({
        i: panelGroupLayoutId,
        w: item.width,
        h: item.height,
        x: item.x,
        y: item.y,
      });
      itemPanelKeys[panelGroupLayoutId] = getPanelKeyFromRef(item.content);
    }

    // Create the panel group and keep track of the ID order
    const panelGroupId = generateId();
    panelGroups[panelGroupId] = {
      id: panelGroupId,
      isCollapsed: layout.spec.display?.collapse?.open === false,
      title: layout.spec.display?.title,
      itemLayouts,
      itemPanelKeys,
    };
    panelGroupIdOrder.push(panelGroupId);
  }

  // Return the state creator function for Zustand
  return (set) => ({
    panelGroups,
    panelGroupOrder: panelGroupIdOrder,

    previousPanelGroupState: { panelGroups, panelGroupIdOrder },

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

    updatePanelGroupLayouts(panelGroupId, itemLayouts) {
      set((state) => {
        const group = state.panelGroups[panelGroupId];
        if (group === undefined) {
          throw new Error(`Cannot find panel group ${panelGroupId}`);
        }
        group.itemLayouts = itemLayouts;
      });
    },
  });
}
