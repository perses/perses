// Copyright 2021 The Perses Authors
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

import { DashboardSpec, GridDefinition } from '@perses-ui/core';
import { GrafanaPanel, GrafanaRow } from './grafana-json-model';

export function convertLayouts(
  rowsAndPanels: Array<GrafanaRow | GrafanaPanel>,
  panelKeys: Map<number, string>
): DashboardSpec['layouts'] {
  const layouts: GridDefinition[] = [];

  // Helper function to create and add a grid definition to layouts
  const addGridDefinition = (group?: PanelGroup) => {
    if (group === undefined) return;

    const grid = createGridDefinition(group, panelKeys);
    if (grid !== undefined) {
      layouts.push(grid);
    }
  };

  let currentGroup: PanelGroup | undefined = undefined;
  for (const rowOrPanel of rowsAndPanels) {
    if (isPanel(rowOrPanel)) {
      // Add the panel to the current group
      currentGroup ??= { row: undefined, panels: [] };
      currentGroup.panels.push(rowOrPanel);
      continue;
    }

    // We have a row and rows mark the end of the previous group, so create a
    // grid for previous
    addGridDefinition(currentGroup);
    currentGroup = undefined;

    // If the new row is collapsed, all its panels will be nested on the row
    // definition itself
    if (rowOrPanel.collapsed === true) {
      // We can just create the grid now for the collapsed panel
      addGridDefinition({ row: rowOrPanel, panels: rowOrPanel.panels });
    } else {
      // Otherwise, start a new group with this row which will contain all
      // panels up until the next row
      currentGroup = { row: rowOrPanel, panels: [] };
    }
  }

  // Take care of any outstanding group after we reach the end
  addGridDefinition(currentGroup);

  return layouts;
}

type PanelGroup = {
  row?: GrafanaRow;
  panels: GrafanaPanel[];
};

function isPanel(
  maybePanel: GrafanaRow | GrafanaPanel
): maybePanel is GrafanaPanel {
  return maybePanel.type !== 'row';
}

function createGridDefinition(
  group: PanelGroup,
  panelKeys: Map<number, string>
): GridDefinition | undefined {
  // If no row and no panels, no grid necessary
  if (group.row === undefined && group.panels.length === 0) {
    return undefined;
  }

  const grid: GridDefinition = {
    kind: 'Grid',
    items: [],
  };

  if (group.row !== undefined) {
    grid.display = {
      title: group.row.title,
      collapse: {
        open: !group.row.collapsed,
      },
    };
  }

  for (const panel of group.panels) {
    const panelKey = panelKeys.get(panel.id);
    if (panelKey === undefined) {
      throw new Error(`Could not find panel key for id ${panel.id}`);
    }
    grid.items.push({
      x: panel.gridPos.x,
      y: panel.gridPos.y,
      width: panel.gridPos.w,
      height: panel.gridPos.h,
      content: { $ref: `#/panels/${panelKey}` },
    });
  }
  return grid;
}
