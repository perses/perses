// Copyright The Perses Authors
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
  dashboardName: 'mixedlayouts',
});

test.describe('Dashboard: Mixed Layouts', () => {
  test('renders both Grid and Tabs layouts', async ({ dashboardPage }) => {
    await expect(dashboardPage.panelGroups).toHaveCount(2);

    const gridSection = dashboardPage.getPanelGroup('Grid Section');
    const tabSection = dashboardPage.getTabGroup('Tab Section');

    await expect(gridSection.container).toBeVisible();
    await expect(tabSection.container).toBeVisible();
  });

  test('Grid and Tabs collapse independently', async ({ dashboardPage }) => {
    const gridSection = dashboardPage.getPanelGroup('Grid Section');
    const tabSection = dashboardPage.getTabGroup('Tab Section');

    // Both should start expanded
    await gridSection.isExpanded();
    await tabSection.isExpanded();

    // Collapse Grid, Tab should remain expanded
    await gridSection.collapse();
    await gridSection.isCollapsed();
    await tabSection.isExpanded();
    await expect(tabSection.tabBar).toBeVisible();

    // Expand Grid, collapse Tab
    await gridSection.expand();
    await tabSection.collapse();
    await gridSection.isExpanded();
    await tabSection.isCollapsed();
    await expect(tabSection.tabBar).toBeHidden();
  });

  test('Tab section shows tab bar with correct tabs', async ({ dashboardPage }) => {
    const tabSection = dashboardPage.getTabGroup('Tab Section');

    await expect(tabSection.tabBar).toBeVisible();

    const tabNames = await tabSection.getTabNames();
    expect(tabNames).toEqual(['First Tab', 'Second Tab']);

    // Default tab (index 0) content should be visible
    const tabPanel1 = dashboardPage.getPanelByName('Tab Panel 1');
    await expect(tabPanel1.container).toBeVisible();

    // Second tab content should be hidden
    const tabPanel2 = dashboardPage.getPanelByName('Tab Panel 2');
    await expect(tabPanel2.container).toBeHidden();
  });
});
