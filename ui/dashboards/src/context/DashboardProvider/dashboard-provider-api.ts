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

import { useDashboardStore } from './DashboardProvider';

export function useEditMode() {
  return useDashboardStore(({ isEditMode, setEditMode }) => ({ isEditMode, setEditMode }));
}

export function useLayouts() {
  return useDashboardStore(
    ({ layouts, addPanelToGroup, movePanelToGroup, updatePanelGroup, swapPanelGroups, deletePanelGroup }) => ({
      layouts,
      addPanelToGroup,
      movePanelToGroup,
      updatePanelGroup,
      swapPanelGroups,
      deletePanelGroup,
    })
  );
}

export function usePanelGroupDialog() {
  return useDashboardStore(
    ({
      panelGroupDialog,
      openPanelGroupDialog,
      closePanelGroupDialog,
      deletePanelGroupDialog,
      openDeletePanelGroupDialog,
      closeDeletePanelGroupDialog,
    }) => ({
      panelGroupDialog,
      openPanelGroupDialog,
      closePanelGroupDialog,
      deletePanelGroupDialog,
      openDeletePanelGroupDialog,
      closeDeletePanelGroupDialog,
    })
  );
}

export function usePanels() {
  return useDashboardStore(
    ({
      panels,
      panelEditor,
      addPanel,
      editPanel,
      deletePanelDialog,
      deletePanels,
      openDeletePanelDialog,
      closeDeletePanelDialog,
    }) => ({
      panels,
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
