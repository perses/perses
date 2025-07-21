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
import { PanelGroupDefinition, PanelGroupItemId } from '@perses-dev/dashboards';
import { PanelGroupId } from '@perses-dev/core';
import { Middleware } from './common';
import { PanelGroupSlice } from './panel-group-slice';

/**
 * Slice that handles viewing Panels in max size ("full screen").
 */
export interface ViewPanelSlice {
  viewPanel: ViewPanelState;
  getViewPanel: () => PanelGroupItemId | undefined;
  setViewPanel: (panelGroupItemId?: PanelGroupItemId) => void;
}

export interface ViewPanelState {
  // Do not use directly, use `getViewPanel()` instead for getting the current viewed PanelGroupItemId!
  panelGroupItemId?: PanelGroupItemId;
  panelRef?: string;
}

/**
 * Curried function for viewing panel in max size ("full screen").
 */
export function createViewPanelSlice(
  viewPanelRef?: string,
  setViewPanelRef?: (ref: string | undefined) => void
): StateCreator<ViewPanelSlice & PanelGroupSlice, Middleware, [], ViewPanelSlice> {
  return (set, get) => ({
    viewPanel: {
      panelGroupItemId: undefined,
      panelRef: viewPanelRef,
    },

    getViewPanel(): PanelGroupItemId | undefined {
      return getViewPanelGroupId(get().panelGroups, get().viewPanel.panelGroupItemId, get().viewPanel.panelRef);
    },

    setViewPanel(panelGroupItemId?: PanelGroupItemId): void {
      set((state) => {
        state.viewPanel = {
          panelRef: undefined,
          panelGroupItemId: panelGroupItemId,
        };
        const panelRef = findPanelRefOfPanelGroupItemId(get().panelGroups, panelGroupItemId);
        if (setViewPanelRef) {
          setViewPanelRef(panelRef);
        }
      });
    },
  });
}

function getViewPanelGroupId(
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>,
  panelGroupItemId?: PanelGroupItemId,
  panelRef?: string
): PanelGroupItemId | undefined {
  if (panelGroupItemId) {
    return panelGroupItemId;
  }

  if (panelRef) {
    return findPanelGroupItemIdOfPanelRef(panelGroups, panelRef);
  }

  return undefined;
}

// Find the PanelGroupItemId of a Panel from a PanelRef
function findPanelGroupItemIdOfPanelRef(
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>,
  panelRef: string
): PanelGroupItemId | undefined {
  for (const panelGroup of Object.values(panelGroups)) {
    // TODO: do something cleaner with panelRef
    const [ref, repeatVariable] = panelRef.split('###');
    const repeatVariableSplit =
      repeatVariable?.split('|').length === 2 ? (repeatVariable.split('|') as [string, string]) : undefined;

    const itemPanel = Object.entries(panelGroup.itemPanelKeys ?? []).find(([_, value]) => value === ref);
    if (itemPanel) {
      const [key] = itemPanel;
      return {
        panelGroupId: panelGroup.id,
        panelGroupItemLayoutId: key,
        repeatVariable: repeatVariableSplit,
      };
    }
  }
  return undefined;
}

// Find the PanelRef from a PanelGroupItemId
function findPanelRefOfPanelGroupItemId(
  panelGroups: Record<PanelGroupId, PanelGroupDefinition>,
  panelGroupItemId?: PanelGroupItemId
): string | undefined {
  if (!panelGroupItemId) {
    return undefined;
  }
  const panelGroup = panelGroups[panelGroupItemId.panelGroupId];
  if (panelGroup) {
    const panelRef = panelGroup.itemPanelKeys[panelGroupItemId.panelGroupItemLayoutId];
    if (panelGroupItemId.repeatVariable !== undefined) {
      return `${panelRef}###${panelGroupItemId.repeatVariable.join('|')}`;
    }
    return panelRef;
  }
  return undefined;
}
