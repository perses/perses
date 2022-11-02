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
import { DashboardStoreState, useDashboardStore } from './DashboardProvider';
import { PanelGroupItemId, PanelGroupId, PanelGroupItemLayout } from './panel-group-slice';

const selectEditMode = ({ isEditMode, setEditMode }: DashboardStoreState) => ({ isEditMode, setEditMode });
export function useEditMode() {
  return useDashboardStore(selectEditMode);
}

/**
 * Returns actions that can be performed on the current dashboard.
 */
const selectDashboardActions = ({ setDashboard, openAddPanelGroup, openAddPanel }: DashboardStoreState) => ({
  setDashboard,
  openAddPanelGroup,
  openAddPanel,
});
export function useDashboardActions() {
  const { setDashboard, openAddPanelGroup, openAddPanel } = useDashboardStore(selectDashboardActions);
  return {
    setDashboard,
    openAddPanelGroup: () => openAddPanelGroup(),
    openAddPanel: () => openAddPanel(),
  };
}

/**
 * Returns an array of PanelGroupIds in the order they appear in the dashboard.
 */
const selectPanelGroupOrder = (store: DashboardStoreState) => store.panelGroupOrder;
export function usePanelGroupIds() {
  return useDashboardStore(selectPanelGroupOrder);
}

/**
 * Returns an array of PanelGroupDefinitions in the order they appear in the dashboard.
 */
const selectPanelGroups = (store: DashboardStoreState) => store.panelGroups;
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
  const panelGroups = useDashboardStore(selectPanelGroups);
  const panelGroup = panelGroups[panelGroupId];
  if (panelGroup === undefined) {
    throw new Error(`Panel group with Id ${panelGroupId} was not found`);
  }
  return panelGroup;
}

/**
 * Returns actions that can be performed on the given panel group.
 */
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

/**
 * Returns functions for moving a panel group up or down. A function will be undefined if the panel group can't be
 * moved in that direction.
 */
const selectSwapPanelGroups = (store: DashboardStoreState) => store.swapPanelGroups;
function useMovePanelGroup(panelGroupId: PanelGroupId) {
  const panelGroupOrder = usePanelGroupIds();
  const swapPanelGroups = useDashboardStore(selectSwapPanelGroups);
  const currentIndex = panelGroupOrder.findIndex((id) => id === panelGroupId);
  const panelGroupsLength = panelGroupOrder.length;

  // const swapPanelGroups = useDashboardStore(selectSwapPanelGroups);

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
const selectPanelGroupEditor = (store: DashboardStoreState) => store.panelGroupEditor;
export function usePanelGroupEditor() {
  return useDashboardStore(selectPanelGroupEditor);
}

/**
 * Gets the Delete Panel Group dialog state.
 */
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

const selectPanels = (store: DashboardStoreState) => store.panels;
export function usePanel(panelGroupItemId: PanelGroupItemId) {
  const { panelGroupId, panelGroupItemLayoutId: panelGroupLayoutId } = panelGroupItemId;
  const panelGroup = usePanelGroup(panelGroupId);
  const panels = useDashboardStore(selectPanels);
  const panelKey = panelGroup?.itemPanelKeys[panelGroupLayoutId];
  if (panelKey === undefined) return;
  const panel = panels[panelKey];

  if (panel === undefined) {
    throw new Error(`Could not find panel for Id ${panelGroupItemId}`);
  }
  return panel;
}

/**
 * Returns actions that can be performed on the given Panel.
 */
const selectPanelActions = ({ openEditPanel, openDeletePanelDialog }: DashboardStoreState) => ({
  openEditPanel,
  openDeletePanelDialog,
});
export function usePanelActions(panelGroupItemId: PanelGroupItemId) {
  const { openEditPanel, openDeletePanelDialog } = useDashboardStore(selectPanelActions);
  return {
    openEditPanel: () => openEditPanel(panelGroupItemId),
    openDeletePanelDialog: () => openDeletePanelDialog(panelGroupItemId),
  };
}

/**
 * Gets the state for the Panel Editor.
 */
const selectPanelEditor = (store: DashboardStoreState) => store.panelEditor;
export function usePanelEditor() {
  return useDashboardStore(selectPanelEditor);
}

/**
 * Gets the state for the Delete Panel dialog.
 */
const selectDeletePanelDialog = ({ deletePanelDialog, deletePanel, closeDeletePanelDialog }: DashboardStoreState) => ({
  deletePanelDialog,
  deletePanel,
  closeDeletePanelDialog,
});
export function useDeletePanelDialog() {
  // TODO: Refactor similar to other dialogs/editors so these are on the editor state itself
  return useDashboardStore(selectDeletePanelDialog);
}

const selectDefaultTimeRange = (store: DashboardStoreState) => store.defaultTimeRange;
export function useDefaultTimeRange() {
  return useDashboardStore(selectDefaultTimeRange);
}
