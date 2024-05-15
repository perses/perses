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
import { PanelGroupDefinition, PanelGroupId, PanelGroupItemId } from '@perses-dev/dashboards';
import { Middleware } from './common';
import { PanelGroupSlice } from './panel-group-slice';

/**
 * Slice that handles duplicating Panels.
 */
export interface ShowPanelSlice {
  showPanel: ShowPanelState;
  getShowPanel: () => PanelGroupItemId | undefined;
  setShowPanel: (panelGroupItemId?: PanelGroupItemId) => void;
}

export interface ShowPanelState {
  panelGroupItemId?: PanelGroupItemId;
  panelRef?: string;
}

/**
 * Curried function for viewing panel full screen.
 */
export function createShowPanelSlice(
  showPanelRef?: string,
  setShowPanelRef?: (ref: string | undefined) => void
): StateCreator<ShowPanelSlice & PanelGroupSlice, Middleware, [], ShowPanelSlice> {
  return (set, get) => ({
    showPanel: {
      panelGroupItemId: undefined,
      panelRef: showPanelRef,
    },

    getShowPanel(): PanelGroupItemId | undefined {
      return getShowPanelGroupId(get().panelGroups, get().showPanel.panelGroupItemId, get().showPanel.panelRef);
    },

    setShowPanel(panelGroupItemId?: PanelGroupItemId) {
      set((state) => {
        state.showPanel = {
          panelRef: undefined,
          panelGroupItemId: panelGroupItemId,
        };
        const panelRef = findPanelRefOfPanelGroupItemId(get().panelGroups, panelGroupItemId);
        if (setShowPanelRef) {
          setShowPanelRef(panelRef);
        }
      });
    },
  });
}

function getShowPanelGroupId(
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
  panelRef?: string
): PanelGroupItemId | undefined {
  for (const panelGroup of Object.values(panelGroups)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const itemPanel = Object.entries(panelGroup.itemPanelKeys ?? []).find(([_, value]) => value === panelRef);
    if (itemPanel) {
      const [key] = itemPanel;
      return {
        panelGroupId: panelGroup.id,
        panelGroupItemLayoutId: key,
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
    return panelGroup.itemPanelKeys[panelGroupItemId.panelGroupItemLayoutId];
  }
  return undefined;
}
