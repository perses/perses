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

import { test as testBase } from '@playwright/test';
import fetch from 'node-fetch';
import { AppHomePage, DashboardPage } from '../pages';

type DashboardTestOptions = {
  projectName: string;
};

type DashboardTestFixtures = {
  dashboardName: string;

  /**
   * Set to true if the test set will modify the dashboard. When true, the
   * dashboard will be reset at the end of each test. Do not use in read-only
   * tests because it will unnecessarily slow them down.
   */
  modifiesDashboard: boolean;
  dashboardPage: DashboardPage;
};

const BACKEND_BASE_URL = 'http://localhost:8080';

async function getDashboardJson(projectName: string, dashboardName: string) {
  const queryUrl = `${BACKEND_BASE_URL}/api/v1/projects/${projectName}/dashboards/${dashboardName}`;
  const results = await fetch(queryUrl);
  const dashboardJson = await results.json();
  return dashboardJson;
}

async function setDashboardJson(projectName: string, dashboardName: string, content: unknown) {
  const queryUrl = `${BACKEND_BASE_URL}/api/v1/projects/${projectName}/dashboards/${dashboardName}`;
  const result = await fetch(queryUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
  return result;
}

/**
 * Fixture for testing specific end-to-end testing dashboards.
 */
export const test = testBase.extend<DashboardTestOptions & DashboardTestFixtures>({
  projectName: 'testing',
  dashboardName: '',
  modifiesDashboard: false,
  dashboardPage: async ({ page, projectName, dashboardName, modifiesDashboard }, use) => {
    let originalDashboardJson;
    if (modifiesDashboard) {
      originalDashboardJson = await getDashboardJson(projectName, dashboardName);
    }

    const persesApp = new AppHomePage(page);
    await persesApp.navigateToDashboard(projectName, dashboardName);

    const dashboardPage = new DashboardPage(page);

    // Use the fixture value in the test.
    await use(dashboardPage);

    if (modifiesDashboard) {
      // Reset the dashboard, so any changes do not impact other tests.
      const result = await setDashboardJson(projectName, dashboardName, originalDashboardJson);
      if (result.status !== 200) {
        console.error('Failed to reset the dashboard after a test. This may lead to unexpected test failures.');
      }
    }
  },
});

export { expect } from '@playwright/test';
