export const TOOLTIP_COPY = {
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
  deletePanel: 'Delete',
  movePanel: 'Move panel',
  // Variable editor buttons
  refreshVariableValues: 'Refresh values',
  copyVariableValues: 'Copy values to clipboard',
};

export const ARIA_LABEL_COPY = {
  // Group buttons
  addPanelToGroup: (groupName: string) => `add panel to group ${groupName}`,
  deleteGroup: (groupName: string) => `delete group ${groupName}`,
  editGroup: (groupName: string) => `edit group ${groupName}`,
  moveGroupDown: (groupName: string) => `move group ${groupName} down`,
  moveGroupUp: (groupName: string) => `move group ${groupName} up`,
  // Panel buttons
  editPanel: (panelName: string) => `edit panel ${panelName}`,
  deletePanel: (panelName: string) => `delete panel ${panelName}`,
  movePanel: (panelName: string) => `move panel ${panelName}`,
};
