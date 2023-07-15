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

import { Locator, Page } from '@playwright/test';
import { VariableEditor } from './VariableEditor';

const mainDashboardListId = 'main-dashboard-list';
const recentDashboardListId = 'recent-dashboard-list';

/**
 * The Perses App project page.
 */
export class AppProjectPage {
  readonly page: Page;

  readonly addDashboardButton: Locator;
  readonly createDashboardDialog: Locator;

  readonly variableEditor: Locator;
  readonly addVariableButton: Locator;

  readonly variableList: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addDashboardButton = page.getByRole('button', { name: 'Add Dashboard' });
    this.createDashboardDialog = page.getByRole('dialog', {
      name: 'Create Dashboard',
    });

    this.addVariableButton = page.getByRole('button', { name: 'Add Variable' });
    this.variableEditor = page.getByTestId('variable-editor');

    this.variableList = page.locator('#project-variable-list');
  }

  async goto(projectName: string) {
    await this.page.goto(`/projects/${projectName}`);
  }

  async gotoDashboardsTab() {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Dashboards');
    await navigationPromise;
  }

  async gotoVariablesTab() {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Variables');
    await navigationPromise;
  }

  async gotoDatasourcesTab() {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Datasources');
    await navigationPromise;
  }

  async createDashboard(name: string) {
    await this.addDashboardButton.click();

    const nameInput = this.createDashboardDialog.getByRole('textbox', {
      name: 'Name',
    });
    await nameInput.type(name);

    await this.createDashboardDialog.getByRole('button', { name: 'Add' }).click();
  }

  /**
   * Navigates to the specified project dashboard using the project page UI.
   * @param projectName - Name of the project.
   * @param dashboardName - Name of the dashboard.
   */
  async navigateToDashboard(projectName: string, dashboardName: string) {
    await this.goto(projectName);

    const navigationPromise = this.page.waitForNavigation();
    await this.clickDashboardItemInList(dashboardName, mainDashboardListId);
    await navigationPromise;
  }

  /**
   * Navigates to the specified project dashboard using the project page
   * @param projectName - Name of the project.
   * @param dashboardName - Name of the dashboard.
   */
  async navigateToDashboardFromRecentDashboards(projectName: string, dashboardName: string) {
    await this.goto(projectName);

    const navigationPromise = this.page.waitForNavigation();
    await this.clickDashboardItemInList(dashboardName, recentDashboardListId);
    await navigationPromise;
  }

  async clickTab(tabLabel: string) {
    const tab = this.page.getByRole('tab').getByText(tabLabel, {
      exact: false,
    });
    await tab.click();
  }

  async clickDashboardItemInList(dashboardName: string, dashboardListId: string) {
    const dashboardButton = this.page.locator(`#${dashboardListId}`).getByText(dashboardName, {
      exact: true,
    });
    await dashboardButton.click();
  }

  async startCreatingVariables() {
    await this.addVariableButton.click();
    const variableEditor = this.getVariableEditor();
    await variableEditor.isVisible();
  }

  getVariableEditor() {
    return new VariableEditor(this.variableEditor);
  }
}
