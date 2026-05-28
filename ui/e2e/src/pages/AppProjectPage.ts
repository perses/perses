// Copyright The Perses Authors
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
import { escapeRegExp } from '../utils';
import { DatasourceEditor } from './DatasourceEditor';
import { VariableEditor } from './VariableEditor';
import { SecretEditor } from './SecretEditor';

const mainDashboardListId = 'main-dashboard-list';

/**
 * The Perses App project page.
 */
export class AppProjectPage {
  readonly page: Page;

  readonly addDashboardButton: Locator;
  readonly addFolderButton: Locator;
  readonly createDashboardDialog: Locator;
  readonly createFolderDialog: Locator;

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
    this.addFolderButton = page.getByRole('button', { name: 'Add Folder' });
    this.createDashboardDialog = page.getByRole('dialog', {
      name: 'Create Dashboard',
    });
    this.createFolderDialog = page.getByRole('dialog', { name: 'Add Folder' });

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
   * @param path - Path to the dashboard as an array of strings. Each element except the last
   *   represents a folder to expand, and the last element is the dashboard name.
   *   Example: ['myFolder', 'mySubFolder', 'myDashboard']
   */
  async navigateToDashboard(projectName: string, path: string[]): Promise<void> {
    await this.goto(projectName);

    const navigationPromise = this.page.waitForURL(`/projects/${projectName}`, { waitUntil: 'domcontentloaded' });
    await this.clickDashboardItemInList(path, mainDashboardListId);
    await navigationPromise;
  }

  async clickTab(tabLabel: string): Promise<void> {
    const tab = this.page.getByRole('tab').getByText(tabLabel, {
      exact: false,
    });
    await tab.click();
  }

  /**
   * Expands folders and clicks the dashboard at the end of the given path.
   * @param path - Array of folder/dashboard names. All elements except the last are folders
   *   to expand in order; the last element is the dashboard to click.
   * @param dashboardListId - The id of the list root element.
   * @throws Error if the path is empty.
   */
  async clickDashboardItemInList(path: string[], dashboardListId: string): Promise<void> {
    if (path.length === 0) {
      throw new Error('Path must contain at least a dashboard name');
    }

    const listRoot = this.page.locator(`#${dashboardListId}`);
    await listRoot.waitFor({ state: 'attached' });

    const folders = path.slice(0, -1);
    const dashboardName = path[path.length - 1]!;

    for (const folderName of folders) {
      const row = listRoot
        .locator('tr')
        .filter({ hasText: new RegExp(`^${escapeRegExp(folderName)}$`, 'i') })
        .first();
      await row.waitFor({ state: 'visible' });
      const toggle = row.locator('[aria-label="expand folder"]');
      await toggle.waitFor({ state: 'visible' });
      const isExpanded = await toggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') {
        await toggle.click();
      }
    }

    const dashboardButton = listRoot.getByText(new RegExp(`^${escapeRegExp(dashboardName)}$`, 'i'));

    const navigationPromise = this.page.waitForURL(new RegExp(`.*/dashboards/${escapeRegExp(dashboardName)}.*`, 'i'));

    await dashboardButton.click();

    await this.page.getByTestId('panel-group-header').first().waitFor();

    return navigationPromise;
  }

  async createFolder(name: string, dashboardNames: string[]): Promise<void> {
    await this.addFolderButton.click();
    await this.createFolderDialog.waitFor({ state: 'visible' });

    await this.createFolderDialog.getByRole('textbox', { name: 'Name' }).fill(name);

    const dashboardsInput = this.createFolderDialog.getByRole('combobox', { name: 'Dashboards' });
    for (const dashboardName of dashboardNames) {
      await dashboardsInput.fill(dashboardName);
      await this.page.getByRole('option', { name: dashboardName }).click();
    }

    // Close the dropdown popup before clicking the submit button
    await dashboardsInput.press('Escape');

    await this.createFolderDialog.getByRole('button', { name: 'Add' }).click();
    await this.createFolderDialog.waitFor({ state: 'hidden' });
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
