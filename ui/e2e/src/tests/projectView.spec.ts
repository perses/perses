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

import { test } from '@playwright/test';
import happoPlaywright from 'happo-playwright';
import { AppProjectPage, DashboardPage } from '../pages';

test.describe('ProjectView', () => {
  const project = 'perses';

  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  test('can navigate to a dashboard', async ({ page }) => {
    const projectPage = new AppProjectPage(page);
    await projectPage.goto(project);

    const navigationPromise = page.waitForNavigation();
    await projectPage.navigateToDashboard(project, 'Demo');
    await navigationPromise;
  });

  test('can navigate to a dashboard recently viewed', async ({ page }) => {
    const projectPage = new AppProjectPage(page);
    await projectPage.goto(project);

    await projectPage.navigateToDashboard(project, 'Demo');

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goBackToProjectPage(project);

    await projectPage.goto(project);
    await projectPage.navigateToDashboardFromRecentDashboards(project, 'Demo');
  });
});
