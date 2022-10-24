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

import { useMemo } from 'react';
import { useDashboardStore } from './DashboardProvider';
import { PanelGroupItemId, PanelGroupId } from './panel-group-slice';

export function useEditMode() {
  return useDashboardStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
}

/**
 * Returns actions that can be performed on the current dashboard.
 */
export function useDashboardActions() {
  const save = useDashboardStore((store) => store.save);
  const reset = useDashboardStore((store) => store.reset);
  const openAddPanelGroup = useDashboardStore((store) => store.openAddPanelGroup);
  const openAddPanel = useDashboardStore((store) => store.openAddPanel);

  return {
    save,
    reset,
    openAddPanelGroup,
    openAddPanel: () => openAddPanel(undefined),
  };
}

/**
 * Returns an array of PanelGroupIds in the order they appear in the dashboard.
 */
export function usePanelGroupIds() {
  return useDashboardStore((store) => store.panelGroupOrder);
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
  const openEditPanelGroup = useDashboardStore((store) => store.openEditPanelGroup);
  const deletePanelGroup = useDashboardStore((store) => store.openDeletePanelGroupDialog);
  const openAddPanel = useDashboardStore((store) => store.openAddPanel);

  return {
    openEditPanelGroup: () => openEditPanelGroup(panelGroupId),
    deletePanelGroup: () => deletePanelGroup(panelGroupId),
    openAddPanel: () => openAddPanel(panelGroupId),
    moveUp,
    moveDown,
  };
}

/**
 * Returns functions for moving a panel group up or down. A function will be undefined if the panel group can't be
 * moved in that direction.
 */
function useMovePanelGroup(panelGroupId: PanelGroupId) {
  const currentIndex = useDashboardStore((store) => store.panelGroupOrder.findIndex((id) => id === panelGroupId));
  const panelGroupsLength = useDashboardStore((store) => store.panelGroupOrder.length);
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
 * Gets the Panel Group editor state.
 */
export function usePanelGroupEditor() {
  return useDashboardStore((store) => store.panelGroupEditor);
}

/**
 * Gets the Delete Panel Group dialog state.
 */
export function useDeletePanelGroupDialog() {
  return useDashboardStore(
    ({ deletePanelGroupDialog, openDeletePanelGroupDialog, closeDeletePanelGroupDialog, deletePanelGroup }) => ({
      deletePanelGroupDialog,
      openDeletePanelGroupDialog,
      closeDeletePanelGroupDialog,
      deletePanelGroup,
    })
  );
}

/**
 * Gets an individual panel in the store. Throws if the panel can't be found.
 */
export function usePanel(panelGroupItemId: PanelGroupItemId) {
  const { panelGroupId, panelGroupLayoutId } = panelGroupItemId;

  const panel = useDashboardStore((store) => {
    const panelKey = store.panelGroups[panelGroupId]?.itemPanelKeys[panelGroupLayoutId];
    if (panelKey === undefined) return;
    return store.panels[panelKey];
  });

  if (panel === undefined) {
    throw new Error(`Could not find panel for Id ${panelGroupItemId}`);
  }
  return panel;
}

/**
 * Returns actions that can be performed on the given Panel.
 */
export function usePanelActions(panelGroupItemId: PanelGroupItemId) {
  const openEditPanel = useDashboardStore((store) => store.openEditPanel);
  const openDeletePanelDialog = useDashboardStore((store) => store.openDeletePanelDialog);
  return {
    openEditPanel: () => openEditPanel(panelGroupItemId),
    openDeletePanelDialog: () => openDeletePanelDialog(panelGroupItemId),
  };
}

/**
 * Gets the state for the Panel Editor.
 */
export function usePanelEditor() {
  return useDashboardStore((store) => store.panelEditor);
}

/**
 * Gets the state for the Delete Panel dialog.
 */
export function useDeletePanelDialog() {
  const deletePanelDialog = useDashboardStore((store) => store.deletePanelDialog);
  // TODO: Refactor similar to other dialogs/editors so these are on the editor state itself
  const deletePanel = useDashboardStore((store) => store.deletePanel);
  const closeDeletePanelDialog = useDashboardStore((store) => store.closeDeletePanelDialog);

  return {
    deletePanelDialog,
    deletePanel,
    closeDeletePanelDialog,
  };
}

export function useDefaultTimeRange() {
  return useDashboardStore((state) => state.defaultTimeRange);
}
