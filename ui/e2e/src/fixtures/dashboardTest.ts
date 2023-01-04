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

import { test as testBase } from '@playwright/test';
import { AppHomePage, DashboardPage } from '../pages';

type DashboardTestOptions = {
  projectName: string;
};

type DashboardTestFixtures = {
  dashboardName: string;
  dashboardPage: DashboardPage;
};

/**
 * Fixture for testing specific end-to-end testing dashboards.
 */
export const test = testBase.extend<DashboardTestOptions & DashboardTestFixtures>({
  projectName: 'testing',
  dashboardName: '',
  dashboardPage: async ({ page, projectName, dashboardName }, use) => {
    const persesApp = new AppHomePage(page);
    await persesApp.navigateToDashboard(projectName, dashboardName);

    const dashboardPage = new DashboardPage(page);

    // Use the fixture value in the test.
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
