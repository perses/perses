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

import { expect, test } from '@playwright/test';
import { AppHomePage, SearchBar } from '../pages';

test.describe('SearchBar', () => {
  test('shows important dashboards when opened without a query', async ({ page }) => {
    const homePage = new AppHomePage(page);
    await homePage.goto();

    const searchBar = new SearchBar(page);
    await searchBar.open();

    await expect(searchBar.getDashboardsHeading()).toBeVisible();

    const demoLink = searchBar.getDashboardLink('perses', 'demo');

    // Verify the dashboard is highlighted (important dashboards have bold text)
    await expect(demoLink).toHaveCSS('font-weight', '900');

    await searchBar.close();
    await expect(searchBar.modal).toBeHidden();
  });

  test('shows no results message when query matches nothing', async ({ page }) => {
    const homePage = new AppHomePage(page);
    await homePage.goto();

    const searchBar = new SearchBar(page);
    await searchBar.open();

    await searchBar.search('xyznonexistentresource123');

    await expect(searchBar.getNoResultsMessage('xyznonexistentresource123')).toBeVisible();

    // Verify no result sections are shown
    await expect(searchBar.getDashboardsHeading()).toBeHidden();
    await expect(searchBar.getProjectsHeading()).toBeHidden();

    // Clear the search and verify important dashboards reappear
    await searchBar.clearSearch();
    await expect(searchBar.getDashboardsHeading()).toBeVisible();

    await searchBar.close();
    await expect(searchBar.modal).toBeHidden();
  });

  test('highlights important dashboards in search results while non-important remain unhighlighted', async ({
    page,
  }) => {
    const homePage = new AppHomePage(page);
    await homePage.goto();

    const searchBar = new SearchBar(page);
    await searchBar.open();

    // Search for "panel" which matches both important (markdownpanel) and non-important (timeserieschartpanel) dashboards
    await searchBar.search('panel');

    // Click "see more..." if present to load additional results
    await searchBar.clickSeeMoreIfPresent();

    await expect(searchBar.getDashboardsHeading()).toBeVisible();

    const importantDashboard = searchBar.getDashboardLink('testing', 'markdownpanel');
    await expect(importantDashboard).toBeVisible();
    await expect(importantDashboard).toHaveCSS('font-weight', '900');

    // timeserieschartpanel is NOT in the important_dashboards list
    const nonImportantDashboard = searchBar.getDashboardLink('testing', 'timeserieschartpanel');
    await expect(nonImportantDashboard).toBeVisible();
    await expect(nonImportantDashboard).toHaveCSS('font-weight', '400');

    await searchBar.close();
    await expect(searchBar.modal).toBeHidden();
  });
});
