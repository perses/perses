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
  dashboardName: 'tablayout',
});

test.describe('Dashboard: Tab Layout', () => {
  test('has initial tab config', async ({ dashboardPage }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    await expect(dashboardPage.panelGroups).toHaveCount(2);
    await expect(tabGroup.tabBar).toBeVisible();

    const tabCount = await tabGroup.getTabCount();
    expect(tabCount).toBe(2);

    const tabNames = await tabGroup.getTabNames();
    expect(tabNames).toEqual(['Overview', 'Details']);
  });

  test('renders first tab content by default', async ({ dashboardPage }) => {
    const overviewPanel = dashboardPage.getPanelByName('Overview Panel');
    const detailsPanel1 = dashboardPage.getPanelByName('Details Panel 1');

    await expect(overviewPanel.container).toBeVisible();
    await expect(detailsPanel1.container).toBeHidden();
  });

  test('can switch tabs', async ({ dashboardPage }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    // Switch to "Details" tab
    await tabGroup.switchToTab(1);

    const detailsPanel1 = dashboardPage.getPanelByName('Details Panel 1');
    const detailsPanel2 = dashboardPage.getPanelByName('Details Panel 2');
    const overviewPanel = dashboardPage.getPanelByName('Overview Panel');

    await expect(detailsPanel1.container).toBeVisible();
    await expect(detailsPanel2.container).toBeVisible();
    await expect(overviewPanel.container).toBeHidden();

    // Switch back to "Overview" tab
    await tabGroup.switchToTab(0);

    await expect(overviewPanel.container).toBeVisible();
    await expect(detailsPanel1.container).toBeHidden();
  });

  test('can expand and collapse', async ({ dashboardPage }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    await tabGroup.isExpanded();

    await tabGroup.collapse();
    await tabGroup.isCollapsed();
    await expect(tabGroup.tabBar).toBeHidden();

    await tabGroup.expand();
    await tabGroup.isExpanded();
    await expect(tabGroup.tabBar).toBeVisible();
  });

  test('updates URL on tab switch', async ({ dashboardPage, page }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    // Switch to tab 1 and wait for URL to update
    await tabGroup.switchToTab(1);
    await page.waitForURL(/perses-tab-[0-9]+=1/);

    // Switch back to tab 0 and wait for URL to update
    await tabGroup.switchToTab(0);
    await page.waitForURL(/perses-tab-[0-9]+=0/);
  });
});

test.describe('Dashboard: Tab Layout (Edit Mode)', () => {
  test.use({
    modifiesDashboard: true,
  });

  test('can create a Tabs panel group', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanelGroup('New Tab Group', 'Tabs');

    const newTabGroup = dashboardPage.getTabGroup('New Tab Group');
    await expect(newTabGroup.tabBar).toBeVisible();
  });

  test('can rename a tab', async ({ dashboardPage, page }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    await dashboardPage.startEditing();
    await tabGroup.renameTab(0, 'Renamed Tab');
    await expect(page.getByRole('dialog')).toBeHidden();

    const tabNames = await tabGroup.getTabNames();
    expect(tabNames[0]).toBe('Renamed Tab');
  });

  test('can add and remove tabs', async ({ dashboardPage }) => {
    const tabGroup = dashboardPage.getTabGroup('My Tab Group');

    await dashboardPage.startEditing();

    // Initial state: 2 tabs
    let tabCount = await tabGroup.getTabCount();
    expect(tabCount).toBe(2);

    // Add a tab
    await tabGroup.addTab();
    tabCount = await tabGroup.getTabCount();
    expect(tabCount).toBe(3);

    // Remove the last tab
    await tabGroup.removeTab(2);
    tabCount = await tabGroup.getTabCount();
    expect(tabCount).toBe(2);
  });
});
