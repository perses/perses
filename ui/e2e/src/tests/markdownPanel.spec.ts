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
import { test } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'MarkdownPanel',
});

test.describe('Dashboard: Markdown Panel', () => {
  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  ['Headings', 'Text', 'Links', 'Code', 'Lists', 'Tables'].forEach((panelName) => {
    test(`displays ${panelName} as expected`, async ({ page, dashboardPage }) => {
      await dashboardPage.isLightMode();

      const markdownPanel = dashboardPage.getPanel(panelName);
      await markdownPanel.container.scrollIntoViewIfNeeded();
      await markdownPanel.isLoaded();

      await happoPlaywright.screenshot(page, markdownPanel.parent, {
        component: 'Markdown Panel',
        variant: `${panelName} [light]`,
      });

      await dashboardPage.toggleTheme();
      await dashboardPage.isDarkMode();

      await markdownPanel.container.scrollIntoViewIfNeeded();
      await markdownPanel.isLoaded();
      await happoPlaywright.screenshot(page, markdownPanel.parent, {
        component: 'Markdown Panel',
        variant: `${panelName} [dark]`,
      });
    });
  });
});
