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

import happoPlaywright from 'happo-playwright';
import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'DuplicatePanels',
  modifiesDashboard: true,
});

test.describe('Dashboard: Panels can be duplicated', () => {
  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  test('multiple times', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    const panelGroup = dashboardPage.getPanelGroup('single panel with space to right');
    await panelGroup.expand();
    const originalPanel = dashboardPage.getPanel({ group: panelGroup, nth: 0 });

    // Duplicate the original panel
    await originalPanel.duplicateButton.click();
    // Panels are referenced by index in this test because they will be renamed
    // later, so their names are not durable locators.
    const duplicateOne = dashboardPage.getPanel({ group: panelGroup, nth: 1 });

    // Duplicate the duplicate. Intentionally testing multiple duplicates to
    // catch some edge cases.
    await duplicateOne.duplicateButton.click();
    const duplicateTwo = dashboardPage.getPanel({ group: panelGroup, nth: 2 });

    await expect(panelGroup.panels).toHaveCount(3);
    await expect(panelGroup.panelHeadings).toContainText([
      'panel being duplicated',
      'panel being duplicated',
      'panel being duplicated',
    ]);

    const duplicatePanels = [duplicateOne, duplicateTwo];

    for (const duplicatePanel of duplicatePanels) {
      await expect(duplicatePanel.container).toBeVisible();

      // Duplicate panel should have the same dimensions.
      const originalBounds = await originalPanel.getBounds();
      const duplicateBounds = await duplicatePanel.getBounds();
      expect(originalBounds.height).toEqual(duplicateBounds.height);
      expect(originalBounds.width).toEqual(duplicateBounds.width);

      // Duplicate panel should have the same content.
      const originalContent = await originalPanel.figure.innerHTML();
      const duplicateContent = await duplicatePanel.figure.innerHTML();
      expect(originalContent).toEqual(duplicateContent);
    }

    // Modify duplicate panels to ensure they are now being treated as distinct
    // from the panels they were duplicated from.
    for (const [i, duplicatePanel] of duplicatePanels.entries()) {
      await dashboardPage.editPanel(duplicatePanel, async (panelEditor) => {
        await panelEditor.nameInput.clear();
        await panelEditor.nameInput.type(`Duplicate panel ${i + 1}`);
      });
    }

    // Ensure that editing the duplicates does not modify the original panel.
    await expect(dashboardPage.panelHeadings).toContainText([
      'panel being duplicated',
      'Duplicate panel 1',
      'Duplicate panel 2',
    ]);

    await dashboardPage.saveChanges();
  });

  [
    'single panel with space to right',
    'single panel with space to left',
    'single panel with space on both sides',
    'single panel without space on same line',
    'multiple panels with space next to original',
    'multiple panels with space not next to original',
    'multiple panels w/o space & more panels below',
  ].forEach((panelGroupName) => {
    test(`with ${panelGroupName}`, async ({ dashboardPage, page }) => {
      await dashboardPage.startEditing();
      const panelGroup = dashboardPage.getPanelGroup(panelGroupName);
      await panelGroup.expand();
      await panelGroup.container.scrollIntoViewIfNeeded();

      const originalPanel = dashboardPage.getPanel({ group: panelGroup, name: 'panel being duplicated' });
      await expect(originalPanel.container).toBeVisible();
      const orignalPanelCount = await panelGroup.panels.count();

      // Duplicate the original panel
      await originalPanel.duplicateButton.click();

      // Wait for new panel to be added and loaded.
      await expect(panelGroup.panels).toHaveCount(orignalPanelCount + 1);
      const newPanel = dashboardPage.getPanel({ group: panelGroup, name: 'panel being duplicated', nth: 1 });
      await newPanel.container.scrollIntoViewIfNeeded();
      await newPanel.isLoaded();

      // Take a screenshot of each duplicate case because it's easier to look
      // at than to try to write a bunch of complex assertions about placement.
      // Take a picture of the root instead of the individual group because the
      // background color and placement are dependent on it to render.
      await happoPlaywright.screenshot(page, dashboardPage.root, {
        component: 'Duplicate panel',
        variant: panelGroupName,
      });
    });
  });
});
