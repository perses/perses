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

import path from 'path';
import type { PlaywrightTestConfig } from '@playwright/test';
import baseConfig from './base.playwright.config';

/**
 * This is the playwright configuration used for continuous integration.
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  ...baseConfig,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: true,

  /* Retry on CI only */
  retries: 2,

  /* Opt out of parallel tests on CI. */
  workers: 1,

  /* Run your local dev server before starting the tests */
  webServer: [
    // Start UI server
    {
      command: 'npm run start',
      port: 3000,
      cwd: path.resolve(__dirname, '../../../'),
      reuseExistingServer: true,
      timeout: 5 * 60 * 1000,
    },
    // Start backend server
    {
      command: './scripts/api_backend_dev.sh',
      port: 8080,
      cwd: path.resolve(__dirname, '../../../..'),
      reuseExistingServer: true,
      timeout: 5 * 60 * 1000,
    },
  ],
};
export default config;
