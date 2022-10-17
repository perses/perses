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

import { getPanelKeyFromRef } from '@perses-dev/core';
import { useMemo } from 'react';
import { useDashboardStore } from './DashboardProvider';
import { PanelGroupItemId, PanelGroupId } from './layout-slice';

export function useEditMode() {
  return useDashboardStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
}

/**
 * Returns actions that can be performed on the current dashboard.
 */
export function useDashboardActions() {
  const { addPanelGroup, reset, save } = useDashboardStore(({ addPanelGroup, reset, save }) => ({
    addPanelGroup,
    reset,
    save,
  }));
  const addPanel = useDashboardStore((store) => store.addPanel);

  return {
    save,
    reset,
    addPanelGroup,
    addPanel: () => addPanel(undefined),
  };
}

/**
 * Returns an array of PanelGroupIds in the order they appear in the dashboard.
 */
export function usePanelGroupIds() {
  return useDashboardStore((store) => store.panelGroupIdOrder);
}

/**
 * Returns an array of PanelGroupDefinitions in the order they appear in the dashboard.
 */
export function useListPanelGroups() {
  const panelGroupIds = usePanelGroupIds();
  const panelGroups = useDashboardStore((store) => store.panelGroups);
  return useMemo(() => {
    return panelGroupIds.map((id) => {
      const group = panelGroups[id];
      if (group === undefined) {
        throw new Error(`Invalid panel group Id found ${id}`);
      }
      return group;
    });
  }, [panelGroupIds, panelGroups]);
}

/**
 * Gets a specific panel group by its id. Throws if the panel group does not exist.
 */
export function usePanelGroup(panelGroupId: PanelGroupId) {
  const panelGroup = useDashboardStore((store) => store.panelGroups[panelGroupId]);
  if (panelGroup === undefined) {
    throw new Error(`Panel group with Id ${panelGroupId} was not found`);
  }
  return panelGroup;
}

/**
 * Returns actions that can be performed on the given panel group.
 */
export function usePanelGroupActions(panelGroupId: PanelGroupId) {
  const { moveUp, moveDown } = useMovePanelGroup(panelGroupId);
  const editPanelGroup = useDashboardStore((store) => store.editPanelGroup);
  const deletePanelGroup = useDashboardStore((store) => store.openDeletePanelGroupDialog);
  const addPanel = useDashboardStore((store) => store.addPanel);

  return {
    editPanelGroup: () => editPanelGroup(panelGroupId),
    deletePanelGroup: () => deletePanelGroup(panelGroupId),
    addPanelToGroup: () => addPanel(panelGroupId),
    moveUp,
    moveDown,
  };
}

/**
 * Returns functions for moving a panel group up or down. A function will be undefined if the panel group can't be
 * moved in that direction.
 */
function useMovePanelGroup(panelGroupId: PanelGroupId) {
  const currentIndex = useDashboardStore((store) => store.panelGroupIdOrder.findIndex((id) => id === panelGroupId));
  const panelGroupsLength = useDashboardStore((store) => store.panelGroupIdOrder.length);
  const swapPanelGroups = useDashboardStore((store) => store.swapPanelGroups);

  if (currentIndex < 0) {
    throw new Error(`Could not find panel group with Id ${panelGroupId} in order array`);
  }

  const moveUp = () => swapPanelGroups(currentIndex, currentIndex - 1);
  const moveDown = () => swapPanelGroups(currentIndex, currentIndex + 1);
  return {
    moveUp: currentIndex > 0 ? moveUp : undefined,
    moveDown: currentIndex < panelGroupsLength - 1 ? moveDown : undefined,
  };
}

/**
 * Gets an individual panel in the store. Throws if the panel can't be found.
 */
export function usePanel(panelGroupItemId: PanelGroupItemId) {
  const { panelGroupId, itemIndex } = panelGroupItemId;

  const panel = useDashboardStore((store) => {
    const panelRef = store.panelGroups[panelGroupId]?.items[itemIndex]?.content;
    if (panelRef === undefined) return;
    const panelKey = getPanelKeyFromRef(panelRef);
    return store.panels[panelKey];
  });

  if (panel === undefined) {
    throw new Error(`Could not find panel for Id ${panelGroupItemId}`);
  }
  return panel;
}

/**
 * Gets the Panel Group editor state.
 */
export function usePanelGroupEditor() {
  return useDashboardStore((store) => store.panelGroupEditor);
}

export function useLayouts() {
  return useDashboardStore(
    ({ addPanelToGroup, movePanelToGroup, updatePanelGroup, swapPanelGroups, deletePanelGroup }) => ({
      addPanelToGroup,
      movePanelToGroup,
      updatePanelGroup,
      swapPanelGroups,
      deletePanelGroup,
    })
  );
}

export function useDeletePanelGroupDialog() {
  return useDashboardStore(({ deletePanelGroupDialog, openDeletePanelGroupDialog, closeDeletePanelGroupDialog }) => ({
    deletePanelGroupDialog,
    openDeletePanelGroupDialog,
    closeDeletePanelGroupDialog,
  }));
}

export function usePanels() {
  return useDashboardStore(
    ({
      panelEditor,
      addPanel,
      editPanel,
      deletePanelDialog,
      deletePanels,
      openDeletePanelDialog,
      closeDeletePanelDialog,
    }) => ({
      panelEditor,
      addPanel,
      editPanel,
      deletePanels,
      deletePanelDialog,
      openDeletePanelDialog,
      closeDeletePanelDialog,
    })
  );
}

export function useDefaultTimeRange() {
  return useDashboardStore((state) => state.defaultTimeRange);
}
