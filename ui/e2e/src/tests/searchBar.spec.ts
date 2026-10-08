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
  test('shows no results when opened without a query', async ({ page }) => {
    const homePage = new AppHomePage(page);
    await homePage.goto();

    const searchBar = new SearchBar(page);
    await searchBar.open();

    await expect(searchBar.searchInput).toBeVisible();
    await expect(searchBar.getDashboardsHeading()).toBeHidden();
    await expect(searchBar.getProjectsHeading()).toBeHidden();

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

    // Clear the search and verify neither results nor the no results message are shown
    await searchBar.clearSearch();
    await expect(searchBar.getNoResultsMessage('xyznonexistentresource123')).toBeHidden();
    await expect(searchBar.getDashboardsHeading()).toBeHidden();

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

    const testCases = [
      // configured explicitly
      {
        query: 'nodeexporter',
        project: 'perses',
        dashboard: 'NodeExporter',
      },
      // configured through the project-wide testing selector
      {
        query: 'markdownpanel',
        project: 'testing',
        dashboard: 'markdownpanel',
      },
      {
        query: 'timeserieschartpanel',
        project: 'testing',
        dashboard: 'timeserieschartpanel',
      },
      // not configured
      {
        query: 'demo',
        project: 'perses',
        dashboard: 'Demo',
      },
    ];

    for (const { query, project, dashboard } of testCases) {
      await searchBar.search(query);
      await searchBar.clickSeeMoreIfPresent();

      await expect(searchBar.getDashboardsHeading()).toBeVisible();

      const dashboardLink = searchBar.getDashboardLink(project, dashboard);
      await expect(dashboardLink).toBeVisible();
    }

    await searchBar.close();
    await expect(searchBar.modal).toBeHidden();
  });
});
