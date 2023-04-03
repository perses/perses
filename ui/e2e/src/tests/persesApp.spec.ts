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

import { test, expect } from '@playwright/test';
import happoPlaywright from 'happo-playwright';
import { AppHomePage, AppProjectPage, DashboardPage } from '../pages';

test.describe('App', () => {
  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  test('can navigate to a dashboard', async ({ page }) => {
    const homePage = new AppHomePage(page);

    await homePage.goto();

    await homePage.showDashboardList('perses');

    const navigationPromise = page.waitForNavigation();
    await homePage.clickDashboardItem('Demo');
    await navigationPromise;
  });

  test('can create a new dashboard', async ({ page }) => {
    const homePage = new AppHomePage(page);
    await homePage.goto();

    // Go to testing project
    await homePage.showDashboardList('testing');
    const projectLink = await page.getByRole('link', { name: 'testing' });
    const navigationPromise = page.waitForNavigation();
    await projectLink.click();
    await navigationPromise;

    // Create a new dashboard
    const projectPage = new AppProjectPage(page);
    await projectPage.createDashboard('my new dashboard');

    const dashboardPage = new DashboardPage(page);

    await dashboardPage.forEachTheme(async (themeName) => {
      // Should see empty state
      await expect(page.getByRole('main')).toContainText("Let's get started");

      await happoPlaywright.screenshot(page, dashboardPage.root, {
        component: 'Empty State',
        variant: themeName,
      });
    });

    // Use empty state to add a new panel
    await page
      .getByRole('button', {
        name: /Add panel$/,
        exact: true,
      })
      .last()
      .click();

    await dashboardPage.addMarkdownPanel('My first panel');

    // Should no longer see empty state
    await expect(page.getByRole('main')).not.toContainText("Let's get started");
  });
});
