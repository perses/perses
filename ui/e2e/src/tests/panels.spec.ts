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

import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'Panels',
});

test.describe('Dashboard: Panels', () => {
  test('can be added directly to a group', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanelToGroup('Row 1');
    await dashboardPage.addMarkdownPanel('Markdown One');

    await expect(dashboardPage.panels).toHaveCount(2);
    const newPanel = dashboardPage.getPanel('Markdown One');
    await expect(newPanel.container).toBeVisible();

    await expect(dashboardPage.panelHeadings).toContainText(['Markdown Example Zero', 'Markdown One']);
  });

  test('can be added to the dashboard', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();

    await dashboardPage.addPanel();

    // verify default panel type is Time Series Chart
    await expect(dashboardPage.panelEditor.getByLabel(/^Type/)).toContainText('Time Series Chart');

    await dashboardPage.addMarkdownPanel('Markdown One');

    await expect(dashboardPage.panels).toHaveCount(2);
    const newPanel = dashboardPage.getPanel('Markdown One');
    await expect(newPanel.container).toBeVisible();

    await expect(dashboardPage.panelHeadings).toContainText(['Markdown Example Zero', 'Markdown One']);
  });

  test('can be removed', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.removePanel('Markdown Example Zero');
    await expect(dashboardPage.panels).toHaveCount(0);
  });

  test('can be moved to a different panel group', async ({ dashboardPage }) => {
    const panelGroupOne = dashboardPage.getPanelGroup('Row 1');
    const panelGroupTwo = dashboardPage.getPanelGroup('Row 2');

    await expect(panelGroupOne.panelHeadings).toContainText(['Markdown Example Zero']);
    await expect(panelGroupTwo.panelHeadings).toContainText([]);

    await dashboardPage.startEditing();
    await dashboardPage.editPanel('Markdown Example Zero', async (panelEditor) => {
      await panelEditor.selectGroup('Row 2');
    });

    await expect(panelGroupOne.panelHeadings).toContainText([]);
    await expect(panelGroupTwo.panelHeadings).toContainText(['Markdown Example Zero']);
  });

  test('can be renamed', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();

    await dashboardPage.editPanel('Markdown Example Zero', async (panelEditor) => {
      await panelEditor.nameInput.clear();
      await panelEditor.nameInput.type('Markdown With a New Name');
    });

    await expect(dashboardPage.panelHeadings).toContainText(['Markdown With a New Name']);
  });

  test('can be resized', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();

    const panel = dashboardPage.getPanel('Markdown Example Zero');

    const originalSize = await panel.getBounds();

    // Resize smaller
    const smallMultiplier = 0.5;
    await panel.resize({
      width: originalSize.width * smallMultiplier,
      height: originalSize.height * smallMultiplier,
    });
    const smallerSize = await panel.getBounds();
    expect(smallerSize.width / originalSize.width).toBeCloseTo(smallMultiplier, 1);
    expect(smallerSize.height / originalSize.height).toBeCloseTo(smallMultiplier, 1);

    // Resize bigger
    const largeMultiplier = 1.5;
    await panel.resize({
      width: originalSize.width * largeMultiplier,
      height: originalSize.height * largeMultiplier,
    });
    const largerSize = await panel.getBounds();
    expect(largerSize.width / originalSize.width).toBeCloseTo(largeMultiplier, 1);
    expect(largerSize.height / originalSize.height).toBeCloseTo(largeMultiplier, 1);
  });

  // There was previously a bug related to going to a smaller screen and back to
  // a larger screen. This test will help avoid a regression.
  test('can resize responsively', async ({ dashboardPage, page }) => {
    const panel = dashboardPage.getPanel('Markdown Example Zero');
    const panelGroup = dashboardPage.getPanelGroup('Row 1');

    // Save original panel size.
    const originalPanelPercentSize = await panelGroup.getPanelPercentOfBounds(panel);

    const previousViewport = page.viewportSize();
    expect(previousViewport).not.toBeNull();

    // The test will fail with the previous expect, so this conditional is not
    // introducing risk. Doing this to provide a type guard, so the the previous
    // viewport can be used when not null.
    // eslint-disable-next-line playwright/no-conditional-in-test
    if (previousViewport) {
      await page.setViewportSize({
        width: 600,
        height: previousViewport.height,
      });

      // Panel is ~100% of panel group on a small screen.
      const smallPanelPercentSize = await panelGroup.getPanelPercentOfBounds(panel);
      expect(smallPanelPercentSize.width).toBeCloseTo(1, 1);

      // Panel returns to the original size, which should be ~25%.
      await page.setViewportSize(previousViewport);
      const largePanelPercentSize = await panelGroup.getPanelPercentOfBounds(panel);
      expect(largePanelPercentSize).toEqual(originalPanelPercentSize);
      expect(largePanelPercentSize.width).toBeCloseTo(0.25, 1);
    }
  });

  test('can be duplicated', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    const originalPanel = dashboardPage.getPanelByIndex(0);

    // Duplicate the original panel
    await originalPanel.duplicateButton.click();
    // Panels are referenced by index in this test because they will be renamed
    // later, so their names are not durable locators.
    const duplicateOne = dashboardPage.getPanelByIndex(1);

    // Duplicate the duplicate. Intentionally testing multiple duplicates to
    // catch some edge cases.
    await duplicateOne.duplicateButton.click();
    const duplicateTwo = dashboardPage.getPanelByIndex(2);

    await expect(dashboardPage.panels).toHaveCount(3);
    await expect(dashboardPage.panelHeadings).toContainText([
      'Markdown Example Zero',
      'Markdown Example Zero',
      'Markdown Example Zero',
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
      'Markdown Example Zero',
      'Duplicate panel 1',
      'Duplicate panel 2',
    ]);
  });
});
