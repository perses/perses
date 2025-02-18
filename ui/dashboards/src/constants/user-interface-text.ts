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
  editDatasources: 'Edit datasources',
  editJson: 'Edit JSON',
  editVariables: 'Edit variables',
  viewJson: 'View JSON',
  // Group buttons
  addPanelToGroup: 'Add panel to group',
  deleteGroup: 'Delete group',
  editGroup: 'Edit group',
  moveGroupDown: 'Move group down',
  moveGroupUp: 'Move group up',
  // Panel buttons
  viewPanel: 'Toggle View Mode',
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
  addPanelToGroup: (groupName: string): string => `add panel to group ${groupName}`,
  deleteGroup: (groupName: string): string => `delete group ${groupName}`,
  editGroup: (groupName: string): string => `edit group ${groupName}`,
  moveGroupDown: (groupName: string): string => `move group ${groupName} down`,
  moveGroupUp: (groupName: string): string => `move group ${groupName} up`,
  // Panel buttons
  viewPanel: (panelName: string): string => `toggle panel ${panelName} view mode`,
  editPanel: (panelName: string): string => `edit panel ${panelName}`,
  duplicatePanel: (panelName: string): string => `duplicate panel ${panelName}`,
  deletePanel: (panelName: string): string => `delete panel ${panelName}`,
  showPanelActions: (panelName: string): string => `show panel actions for ${panelName}`,
  movePanel: (panelName: string): string => `move panel ${panelName}`,
};
