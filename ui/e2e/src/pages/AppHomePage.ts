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

import { Page } from '@playwright/test';

const importantDashboardListId = 'important-dashboard-list';

/**
 * The Perses App home page.
 */
export class AppHomePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
  }

  /**
   * Navigates to the specified project dashboard using the home page UI.
   * @param projectName - Name of the project.
   * @param dashboardName - Name of the dashboard.
   */
  async navigateToDashboard(projectName: string, dashboardName: string) {
    this.goto();

    await this.showDashboardList(projectName);
    const navigationPromise = this.page.waitForNavigation();
    await this.clickDashboardItem(projectName, dashboardName);
    await navigationPromise;
  }

  /**
   * Navigates to the specified project using the home page UI.
   * @param projectName - Name of the project.
   */
  async navigateToProject(projectName: string) {
    this.goto();

    const navigationPromise = this.page.waitForNavigation();
    await this.clickProjectLink(projectName);
    await navigationPromise;
  }

  async showDashboardList(projectName: string) {
    const projectButton = this.page.getByRole('button', {
      expanded: false,
      name: projectName,
    });
    await projectButton.click();
  }

  async clickProjectLink(projectName: string) {
    const projectLink = this.page.getByRole('link', { name: projectName });
    await projectLink.click();
  }

  async clickDashboardItem(projectName: string, dashboardName: string) {
    const dashboardButton = this.page.locator(`#${projectName}-dashboard-list`).getByText(dashboardName, {
      exact: true,
    });
    await dashboardButton.click();
  }

  async clickImportantDashboardItem(projectName: string, dashboardName: string) {
    const dashboardButton = this.page
      .locator(`#${importantDashboardListId}`)
      .getByRole('row', { name: `${projectName} ${dashboardName}` });
    await dashboardButton.click();
  }

  async clickRecentDashboardItem(projectName: string, dashboardName: string) {
    const dashboardButton = this.page.getByRole('button', {
      name: `${dashboardName} ${projectName}`,
    });

    await dashboardButton.click();
  }

  async searchDashboardOrProject(search: string) {
    await this.page.getByLabel('Search a Project or a Dashboard').fill(search);
  }
}
