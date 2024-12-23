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
import { DatasourceEditor } from './DatasourceEditor';
import { VariableEditor } from './VariableEditor';
import { SecretEditor } from './SecretEditor';

const mainDashboardListId = 'main-dashboard-list';
const recentDashboardListId = 'recent-dashboard-list';

/**
 * The Perses App project page.
 */
export class AppProjectPage {
  readonly page: Page;

  readonly addDashboardButton: Locator;
  readonly createDashboardDialog: Locator;

  readonly datasourceEditor: Locator;
  readonly addDatasourceButton: Locator;
  readonly datasourceList: Locator;

  readonly secretEditor: Locator;
  readonly addSecretButton: Locator;
  readonly secretList: Locator;

  readonly variableEditor: Locator;
  readonly addVariableButton: Locator;
  readonly variableList: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addDashboardButton = page.getByRole('button', { name: 'Add Dashboard' });
    this.createDashboardDialog = page.getByRole('dialog', {
      name: 'Create Dashboard',
    });

    this.addDatasourceButton = page.getByRole('button', { name: 'Add Datasource' });
    this.datasourceEditor = page.getByTestId('datasource-editor');
    this.datasourceList = page.locator('#project-datasource-list');

    this.addSecretButton = page.getByRole('button', { name: 'Add Secret' });
    this.secretEditor = page.getByTestId('secret-editor');
    this.secretList = page.locator('#project-secret-list');

    this.addVariableButton = page.getByRole('button', { name: 'Add Variable' });
    this.variableEditor = page.getByTestId('variable-editor');
    this.variableList = page.locator('#project-variable-list');
  }

  async goto(projectName: string): Promise<void> {
    await this.page.goto(`/projects/${projectName}`);
  }

  async gotoDashboardsTab(): Promise<void> {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Dashboards');
    await navigationPromise;
  }

  async gotoDatasourcesTab(): Promise<void> {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Datasources');
    await navigationPromise;
  }

  async gotoSecretsTab(): Promise<void> {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Secrets');
    await navigationPromise;
  }

  async gotoVariablesTab(): Promise<void> {
    const navigationPromise = this.page.waitForNavigation();
    await this.clickTab('Variables');
    await navigationPromise;
  }

  async createDashboard(name: string): Promise<void> {
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
  async navigateToDashboard(projectName: string, dashboardName: string): Promise<void> {
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
  async navigateToDashboardFromRecentDashboards(projectName: string, dashboardName: string): Promise<void> {
    await this.goto(projectName);

    const navigationPromise = this.page.waitForNavigation();
    await this.clickDashboardItemInList(dashboardName, recentDashboardListId);
    await navigationPromise;
  }

  async clickTab(tabLabel: string): Promise<void> {
    const tab = this.page.getByRole('tab').getByText(tabLabel, {
      exact: false,
    });
    await tab.click();
  }

  async clickDashboardItemInList(dashboardName: string, dashboardListId: string): Promise<void> {
    const dashboardButton = this.page.locator(`#${dashboardListId}`).getByText(new RegExp(`^${dashboardName}$`, 'i'));
    await dashboardButton.click();
  }

  getDatasourceEditor(): DatasourceEditor {
    return new DatasourceEditor(this.datasourceEditor);
  }

  getSecretEditor(): SecretEditor {
    return new SecretEditor(this.secretEditor);
  }

  getVariableEditor(): VariableEditor {
    return new VariableEditor(this.variableEditor);
  }
}
