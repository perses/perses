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

import type { PlaywrightTestConfig, devices } from '@playwright/test';

/**
 * This is the base playwright configuration that contains common settings.
 * Environment-specific testing configuration files extend from it.
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: '../tests',
  /* Maximum time one test can run for. */
  timeout: 60 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html'], ['list', { printSteps: true }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /**
     * Disabled per playwright documentation, so we can reliably mock network
     * requests.
     * https://playwright.dev/docs/network#missing-network-events-and-service-workers
     */
    serviceWorkers: 'block',

    // Use a consistent time zone, so we do not have to worry about flakiness
    // depending on the server.
    timezoneId: 'America/Los_Angeles',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Keep this in sync with the setting in `.happo.js` for consistency for
        // canvas elements, which are converted into images when run in playwright
        // and sent to happo.
        viewport: { width: 1200, height: 800 },
      },
    },
  ],
};

export default config;
