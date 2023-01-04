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

import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

const IS_CI = process.env.CI;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './src/tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!IS_CI,
  /* Retry on CI only */
  retries: IS_CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: IS_CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: IS_CI ? [['github', 'html']] : [['html'], ['list', { printSteps: true }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3000',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /* Run your local dev server before starting the tests */
  // Only run dev server in CI. During local development, you are more likely to
  // want to keep the local servers running separately across test runs. Also,
  // Playwright seems to struggle to clean up all of the processes from
  // turborepo, which is more problematic when running on a local machine
  // instead of an ephemeral container in CI.
  webServer: IS_CI
    ? [
        {
          command: 'npm run start',
          port: 3000,
          cwd: path.resolve(__dirname, '../'),
          reuseExistingServer: true,
          timeout: 5 * 60 * 1000,
        },
        {
          command: './scripts/api_backend_dev.sh',
          port: 8080,
          cwd: path.resolve(__dirname, '../..'),
          reuseExistingServer: true,
          timeout: 5 * 60 * 1000,
        },
      ]
    : [],
};

export default config;
