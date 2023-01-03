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

import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'PanelGroups',
});

test.describe('Dashboard: Panel Groups', () => {
  test('has initial panel config', async ({ dashboardPage }) => {
    const panelGroup = dashboardPage.getPanelGroup('Row 1');

    await expect(dashboardPage.panelGroups).toHaveCount(1);

    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row 1']);
    await panelGroup.isExpanded();
  });

  test('can expand and collapse', async ({ dashboardPage }) => {
    const panelGroup = dashboardPage.getPanelGroup('Row 1');

    await panelGroup.isExpanded();

    await panelGroup.collapse();
    await panelGroup.isCollapsed();

    await panelGroup.expand();
    await panelGroup.isExpanded();
  });

  test('can edit panel name', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.editPanelGroup('Row 1', { name: 'Row One' });

    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row One']);
  });

  test('can add, remove, and reorder', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();

    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row 1']);

    await dashboardPage.addPanelGroup('Row Two');
    await dashboardPage.addPanelGroup('Row Three');
    await expect(dashboardPage.panelGroups).toHaveCount(3);

    // New panels are inserted at the top.
    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row Three', 'Row Two', 'Row 1']);

    await dashboardPage.getPanelGroup('Row Two').moveDown();
    await dashboardPage.getPanelGroup('Row Three').moveDown();
    await dashboardPage.getPanelGroup('Row Two').moveUp();
    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row 1', 'Row Two', 'Row Three']);

    await dashboardPage.deletePanelGroup('Row Two');
    await expect(dashboardPage.panelGroupHeadings).toHaveText(['Row 1', 'Row Three']);
  });
});
