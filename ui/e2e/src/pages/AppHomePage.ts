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

import { Page } from '@playwright/test';

export class AppHomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  async navigateToDashboard(projectName: string, dashboardName: string) {
    this.goto();

    await this.showDashboardList(projectName);
    const navigationPromise = this.page.waitForNavigation();
    await this.clickDashboardItem(dashboardName);
    await navigationPromise;
  }

  async showDashboardList(projectName: string) {
    const projectButton = this.page.getByRole('button', {
      expanded: false,
      name: projectName,
    });
    await projectButton.click();
  }

  async clickDashboardItem(dashboardName: string) {
    const dashboardButton = this.page.getByRole('button', {
      name: dashboardName,
    });
    await dashboardButton.click();
  }
}
