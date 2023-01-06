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

import type { PlaywrightTestConfig } from '@playwright/test';
import baseConfig from './base.playwright.config';

/**
 * This is the playwright configuration used for local development.
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  ...baseConfig,

  /* Allow only in local development because it can be helpful for debugging. */
  forbidOnly: false,

  /* Do not retry during local development. */
  retries: 0,

  /* Run tests in parallel during local development for fast iteration. */
  workers: undefined,

  // We do not automatically run the development servers during local
  // local devlopment for two reasons. (1) During local development, people are
  // more likely to want to keep longer-running dev servers across test runs and
  // other development activities. (2) Playwright struggles to fully clean up
  // all the processes started by turborepo, so you can easily end up with a
  // lot of zombie node processes on your machine that are annoying to clean up.
  webServer: [],
};
export default config;
