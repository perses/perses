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
  dashboardName: 'Panels',
});

test.describe('Dashboard: Panels', () => {
  test('can be added directly to a group', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();
    await dashboardPage.addPanelToGroup('Row 1');
    await dashboardPage.addMarkdownPanel('Markdown One');

    await expect(dashboardPage.panels).toHaveCount(2);
    const newPanel = dashboardPage.getPanel('Markdown One');
    await expect(newPanel).toBeVisible();

    await expect(dashboardPage.panelHeadings).toContainText(['Markdown Example Zero', 'Markdown One']);
  });

  test('can be added to the dashboard', async ({ dashboardPage }) => {
    await dashboardPage.startEditing();

    await dashboardPage.addPanel();
    await dashboardPage.addMarkdownPanel('Markdown One');

    await expect(dashboardPage.panels).toHaveCount(2);
    const newPanel = dashboardPage.getPanel('Markdown One');
    await expect(newPanel).toBeVisible();

    await expect(dashboardPage.panelHeadings).toContainText(['Markdown Example Zero', 'Markdown One']);
  });
});
