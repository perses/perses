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

import { useCallback, useMemo } from 'react';
import { DashboardStoreState, useDashboardStore } from './DashboardProvider';
import { PanelGroupItemId, PanelGroupId, PanelGroupItemLayout } from './panel-group-slice';

const selectEditMode = ({ isEditMode, setEditMode }: DashboardStoreState) => ({ isEditMode, setEditMode });
export function useEditMode() {
  return useDashboardStore(selectEditMode);
}

const selectDashboardActions = ({ setDashboard, openAddPanelGroup, openAddPanel }: DashboardStoreState) => ({
  setDashboard,
  openAddPanelGroup,
  openAddPanel,
});
/**
 * Returns actions that can be performed on the current dashboard.
 */
export function useDashboardActions() {
  const { setDashboard, openAddPanelGroup, openAddPanel } = useDashboardStore(selectDashboardActions);
  return {
    setDashboard,
    openAddPanelGroup: () => openAddPanelGroup(),
    openAddPanel: () => openAddPanel(),
  };
}

const selectPanelGroupOrder = (state: DashboardStoreState) => state.panelGroupOrder;
/**
 * Returns an array of PanelGroupIds in the order they appear in the dashboard.
 */
export function usePanelGroupIds() {
  return useDashboardStore(selectPanelGroupOrder);
}

const selectPanelGroups = (state: DashboardStoreState) => state.panelGroups;
/**
 * Returns an array of PanelGroupDefinitions in the order they appear in the dashboard.
 */
export function useListPanelGroups() {
  const panelGroupIds = usePanelGroupIds();
  const panelGroups = useDashboardStore(selectPanelGroups);
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
  const panelGroup = useDashboardStore(useCallback((state) => state.panelGroups[panelGroupId], [panelGroupId]));
  if (panelGroup === undefined) {
    throw new Error(`Panel group with Id ${panelGroupId} was not found`);
  }
  return panelGroup;
}

const selectPanelGroupActions = ({
  openEditPanelGroup,
  deletePanelGroup,
  openAddPanel,
  updatePanelGroupLayouts,
}: DashboardStoreState) => ({
  openEditPanelGroup,
  deletePanelGroup,
  openAddPanel,
  updatePanelGroupLayouts,
});
/**
 * Returns actions that can be performed on the given panel group.
 */
export function usePanelGroupActions(panelGroupId: PanelGroupId) {
  const { moveUp, moveDown } = useMovePanelGroup(panelGroupId);
  const { openEditPanelGroup, deletePanelGroup, openAddPanel, updatePanelGroupLayouts } =
    useDashboardStore(selectPanelGroupActions);

  return {
    openEditPanelGroup: () => openEditPanelGroup(panelGroupId),
    deletePanelGroup: () => deletePanelGroup(panelGroupId),
    openAddPanel: () => openAddPanel(panelGroupId),
    moveUp,
    moveDown,
    updatePanelGroupLayouts: (itemLayouts: PanelGroupItemLayout[]) =>
      updatePanelGroupLayouts(panelGroupId, itemLayouts),
  };
}

const selectSwapPanelGroups = (state: DashboardStoreState) => state.swapPanelGroups;
const selectPanelGroupsLength = (state: DashboardStoreState) => state.panelGroupOrder.length;
/**
 * Returns functions for moving a panel group up or down. A function will be undefined if the panel group can't be
 * moved in that direction.
 */
function useMovePanelGroup(panelGroupId: PanelGroupId) {
  const currentIndex = useDashboardStore(
    useCallback((store) => store.panelGroupOrder.findIndex((id) => id === panelGroupId), [panelGroupId])
  );
  const panelGroupsLength = useDashboardStore(selectPanelGroupsLength);
  const swapPanelGroups = useDashboardStore(selectSwapPanelGroups);

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

const selectPanelGroupEditor = (state: DashboardStoreState) => state.panelGroupEditor;
/**
 * Gets the Panel Group editor state.
 */
export function usePanelGroupEditor() {
  return useDashboardStore(selectPanelGroupEditor);
}

const selectDeletePanelGroupDialog = ({
  deletePanelGroupDialog,
  openDeletePanelGroupDialog,
  closeDeletePanelGroupDialog,
  deletePanelGroup,
}: DashboardStoreState) => ({
  deletePanelGroupDialog,
  openDeletePanelGroupDialog,
  closeDeletePanelGroupDialog,
  deletePanelGroup,
});
/**
 * Gets the Delete Panel Group dialog state.
 */
export function useDeletePanelGroupDialog() {
  const { deletePanelGroupDialog, openDeletePanelGroupDialog, closeDeletePanelGroupDialog, deletePanelGroup } =
    useDashboardStore(selectDeletePanelGroupDialog);
  return {
    deletePanelGroupDialog,
    deletePanelGroup,
    openDeletePanelGroupDialog,
    closeDeletePanelGroupDialog: () => closeDeletePanelGroupDialog(),
  };
}

/**
 * Gets an individual panel in the store. Throws if the panel can't be found.
 */
export function usePanel(panelGroupItemId: PanelGroupItemId) {
  const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;
  const panel = useDashboardStore(
    useCallback(
      (store) => {
        const panelKey = store.panelGroups[panelGroupId]?.itemPanelKeys[panelGroupLayoutId];
        if (panelKey === undefined) return;
        return store.panels[panelKey];
      },
      [panelGroupId, panelGroupLayoutId]
    )
  );

  if (panel === undefined) {
    throw new Error(`Could not find panel for Id ${panelGroupItemId}`);
  }
  return panel;
}

const selectPanelActions = ({ openEditPanel, openDeletePanelDialog, duplicatePanel }: DashboardStoreState) => ({
  openEditPanel,
  openDeletePanelDialog,
  duplicatePanel,
});

/**
 * Returns actions that can be performed on the given Panel.
 */
export function usePanelActions(panelGroupItemId: PanelGroupItemId) {
  const { openEditPanel, openDeletePanelDialog, duplicatePanel } = useDashboardStore(selectPanelActions);
  return {
    openEditPanel: () => openEditPanel(panelGroupItemId),
    openDeletePanelDialog: () => openDeletePanelDialog(panelGroupItemId),
    duplicatePanel: () => duplicatePanel(panelGroupItemId),
  };
}

const selectPanelEditor = (state: DashboardStoreState) => state.panelEditor;
/**
 * Gets the state for the Panel Editor.
 */
export function usePanelEditor() {
  return useDashboardStore(selectPanelEditor);
}

const selectDeletePanelDialog = ({ deletePanelDialog, deletePanel, closeDeletePanelDialog }: DashboardStoreState) => ({
  deletePanelDialog,
  deletePanel,
  closeDeletePanelDialog,
});

/**
 * Gets the state for the Delete Panel dialog.
 */
export function useDeletePanelDialog() {
  // TODO: Refactor similar to other dialogs/editors so these are on the editor state itself
  return useDashboardStore(selectDeletePanelDialog);
}

const selectDashboardDuration = (state: DashboardStoreState) => state.duration;
export function useDashboardDuration() {
  return useDashboardStore(selectDashboardDuration);
}

const selectDiscardChangesConfirmationDialog = ({
  discardChangesConfirmationDialog,
  openDiscardChangesConfirmationDialog,
  closeDiscardChangesConfirmationDialog,
}: DashboardStoreState) => ({
  discardChangesConfirmationDialog,
  openDiscardChangesConfirmationDialog,
  closeDiscardChangesConfirmationDialog,
});
export function useDiscardChangesConfirmationDialog() {
  return useDashboardStore(selectDiscardChangesConfirmationDialog);
}

const selectEditJsonDialog = ({ editJsonDialog, openEditJsonDialog, closeEditJsonDialog }: DashboardStoreState) => ({
  editJsonDialog,
  openEditJsonDialog,
  closeEditJsonDialog,
});
/**
 * Gets the state for the edit JSON dialog.
 */
export function useEditJsonDialog() {
  return useDashboardStore(selectEditJsonDialog);
}
