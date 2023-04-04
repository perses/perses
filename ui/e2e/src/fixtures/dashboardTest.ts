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

import { ConsoleMessage, test as testBase } from '@playwright/test';
import fetch from 'node-fetch';
import { AppHomePage, DashboardPage } from '../pages';

type DashboardTestOptions = {
  projectName: string;
};

type DashboardTestFixtures = {
  /**
   * Name of the dashboard to load for the tests.
   */
  dashboardName: string;

  /**
   * Set to true if the test set will modify the dashboard. When true, the
   * dashboard will be reset at the end of each test. Do not use in read-only
   * tests because it will unnecessarily slow them down.
   */
  modifiesDashboard: boolean;

  /**
   * Time in unix milliseconds to be returned when `Date.now` is called on the
   * page. Useful for stabilizing tests that depend on the current time.
   */
  mockNow: number;

  dashboardPage: DashboardPage;
};

const BACKEND_BASE_URL = 'http://localhost:8080';

async function getDashboardJson(projectName: string, dashboardName: string) {
  const queryUrl = `${BACKEND_BASE_URL}/api/v1/projects/${projectName}/dashboards/${dashboardName}`;
  const results = await fetch(queryUrl);
  const dashboardJson = await results.json();
  return dashboardJson;
}

async function createDashboard(content: unknown) {
  const queryUrl = `${BACKEND_BASE_URL}/api/v1/dashboards`;
  return fetch(queryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(content),
  });
}

async function duplicateDashboard(projectName: string, dashboardName: string, newDashboardName: string) {
  const originalDashboardJson = await getDashboardJson(projectName, dashboardName);
  const newDashboardJson = {
    ...originalDashboardJson,
    metadata: {
      ...originalDashboardJson.metadata,
      project: projectName,
      name: newDashboardName,
    },
  };
  const result = await createDashboard(newDashboardJson);
  if (!result.ok) {
    throw new Error(
      `Unable to create test dashboard '${newDashboardName}'. Failed with status '${result.status}: ${result.statusText}'.`
    );
  }
}

async function deleteDashboard(projectName: string, dashboardName: string) {
  const queryUrl = `${BACKEND_BASE_URL}/api/v1/projects/${projectName}/dashboards/${dashboardName}`;
  const result = await fetch(queryUrl, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  return result;
}

// We want to throw on console errors that may mean the app is broken.
// Some of the libraries we use (e.g. emotion) throw console errors we do not
// care about at this time. We track those here, so they can be ignored.
const IGNORE_CONSOLE_ERRORS = [
  // See https://github.com/emotion-js/emotion/issues/1105
  'potentially unsafe when doing server-side rendering',
];
function shouldIgnoreConsoleError(message: ConsoleMessage) {
  const msgText = message.text();
  return IGNORE_CONSOLE_ERRORS.some((ignoreErr) => msgText.includes(ignoreErr));
}

/**
 * Generates a dashboard name to use when duplicating a dashboard for a given
 * test.
 */
function generateDuplicateDashboardName(dashboardName: string, testTitle: string, retry: number) {
  // Replaces any characters that are not allowed in dashboard names with
  // underscores.
  const normalizedTitle = testTitle.replace(/[^a-zA-Z0-9_.:-]+/g, '_');

  return [dashboardName, normalizedTitle, retry].join('__');
}

function getMockDateScript(mockNow: number) {
  // From https://github.com/microsoft/playwright/issues/6347#issuecomment-1085850728
  return `{
    // Extend Date constructor to default to fakeNow
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${mockNow});
        } else {
          super(...args);
        }
      }
    }
    // Override Date.now() to start from fakeNow
    const __DateNowOffset = ${mockNow} - Date.now();
    const __DateNow = Date.now;
    Date.now = () => __DateNow() + __DateNowOffset;
  }`;
}

/**
 * Fixture for testing specific end-to-end testing dashboards.
 */
export const test = testBase.extend<DashboardTestOptions & DashboardTestFixtures>({
  projectName: 'testing',
  dashboardName: '',
  modifiesDashboard: false,
  mockNow: 0,
  dashboardPage: async ({ page, projectName, dashboardName, modifiesDashboard, mockNow }, use, testInfo) => {
    let testDashboardName: string = dashboardName;

    if (modifiesDashboard) {
      testDashboardName = generateDuplicateDashboardName(dashboardName, testInfo.title, testInfo.retry);
      await duplicateDashboard(projectName, dashboardName, testDashboardName);
    }

    if (mockNow) {
      // Injects date mock into the page.
      await page.addInitScript(getMockDateScript(mockNow));
    }

    const persesApp = new AppHomePage(page);

    const consoleErrors: ConsoleMessage[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !shouldIgnoreConsoleError(msg)) {
        // Watch for console errors because they are often a sign that something
        // is wrong.
        consoleErrors.push(msg);
      }
    });

    await persesApp.navigateToDashboard(projectName, testDashboardName);

    const dashboardPage = new DashboardPage(page);

    // Use the fixture value in the test.
    await use(dashboardPage);

    await dashboardPage.cleanupMockRequests();

    if (modifiesDashboard) {
      // Clean up the duplicate dashboard created for the test.
      const result = await deleteDashboard(projectName, testDashboardName);
      if (!result.ok) {
        console.error('Failed to clean up the dashboard after a test.');
      }
    }

    // If console errors are found, log the errors to help with debugging and
    // fail the test.
    if (consoleErrors.length) {
      consoleErrors.forEach((pageError) => {
        console.error(pageError);
      });
      throw new Error(`${consoleErrors.length} console errors seen while running test.`);
    }
  },
});

export { expect } from '@playwright/test';
