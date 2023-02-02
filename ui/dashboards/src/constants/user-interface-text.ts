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

export const TOOLTIP_TEXT = {
  // Toolbar buttons
  addPanel: 'Add panel',
  addGroup: 'Add panel group',
  downloadDashboard: 'Download JSON',
  editVariables: 'Edit variables',
  refreshDashboard: 'Refresh dashboard',
  // Group buttons
  addPanelToGroup: 'Add panel to group',
  deleteGroup: 'Delete group',
  editGroup: 'Edit group',
  moveGroupDown: 'Move group down',
  moveGroupUp: 'Move group up',
  // Panel buttons
  editPanel: 'Edit',
  duplicatePanel: 'Duplicate',
  deletePanel: 'Delete',
  movePanel: 'Move',
  // Variable editor buttons
  refreshVariableValues: 'Refresh values',
  copyVariableValues: 'Copy values to clipboard',
};

export const ARIA_LABEL_TEXT = {
  // Group buttons
  addPanelToGroup: (groupName: string) => `add panel to group ${groupName}`,
  deleteGroup: (groupName: string) => `delete group ${groupName}`,
  editGroup: (groupName: string) => `edit group ${groupName}`,
  moveGroupDown: (groupName: string) => `move group ${groupName} down`,
  moveGroupUp: (groupName: string) => `move group ${groupName} up`,
  // Panel buttons
  editPanel: (panelName: string) => `edit panel ${panelName}`,
  duplicatePanel: (panelName: string) => `duplicate panel ${panelName}`,
  deletePanel: (panelName: string) => `delete panel ${panelName}`,
  movePanel: (panelName: string) => `move panel ${panelName}`,
};
