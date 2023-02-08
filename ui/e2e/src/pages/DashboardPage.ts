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

import { Page, Locator, expect } from '@playwright/test';
import { PanelEditor } from './PanelEditor';
import { VariableEditor } from './VariableEditor';
import { PanelGroup } from './PanelGroup';
import { Panel } from './Panel';

type PanelGroupConfig = {
  name: string;
};

type MockQueryRangeQueryConfig = {
  query: string;
  response: {
    status?: 200;
    body: string;
  };
};

type MockQueryRangeConfig = {
  queries: MockQueryRangeQueryConfig[];
};

type ThemeName = 'light' | 'dark';

type PanelNameOrPanel = string | Panel;

/**
 * Perses App dashboard page.
 */
export class DashboardPage {
  readonly page: Page;

  readonly root: Locator;

  readonly themeToggle: Locator;

  readonly toolbar: Locator;
  readonly editButton: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly addPanelGroupButton: Locator;
  readonly addPanelButton: Locator;
  readonly editVariablesButton: Locator;

  readonly panelGroups: Locator;
  readonly panelGroupHeadings: Locator;

  readonly panels: Locator;
  readonly panelHeadings: Locator;

  readonly variableList: Locator;
  readonly variableListItems: Locator;

  readonly panelEditor: Locator;
  readonly variableEditor: Locator;

  readonly alert: Locator;

  constructor(page: Page) {
    this.page = page;

    this.root = page.locator('#root');

    this.themeToggle = page.getByRole('checkbox', { name: 'Theme' });

    this.toolbar = page.getByTestId('dashboard-toolbar');
    this.editButton = this.toolbar.getByRole('button', { name: 'Edit' });
    this.cancelButton = this.toolbar.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.toolbar.getByRole('button', { name: 'Save' });
    this.addPanelGroupButton = this.toolbar.getByRole('button', { name: 'Add Panel Group' });
    this.editVariablesButton = this.toolbar.getByRole('button', { name: 'Edit variables' });

    // Needed to select "Add Panel" group button and NOT "Add Panel Group."
    // Exact match on "Add Panel" does not work in some situations, possibly
    // because of other content like icons inside the button.
    this.addPanelButton = this.toolbar.getByRole('button', { name: /Add panel$/ });

    this.panelGroups = page.getByTestId('panel-group');
    this.panelGroupHeadings = this.panelGroups.getByTestId('panel-group-header').getByRole('heading', { level: 2 });

    this.panels = page.getByTestId('panel');
    this.panelHeadings = this.panels.locator('header').getByRole('heading');

    this.variableList = page.getByTestId('variable-list');
    this.variableListItems = this.variableList.getByTestId('template-variable');

    this.panelEditor = page.getByTestId('panel-editor');
    this.variableEditor = page.getByTestId('variable-editor');

    this.alert = page.getByRole('alert');
  }

  async startEditing() {
    await this.editButton.click();
    await this.cancelButton.isVisible();
  }

  async saveChanges() {
    await this.saveButton.click();
    await this.editButton.isVisible();
    await expect(this.alert).toContainText('success');
  }

  getDialog(name: string) {
    return this.page.getByRole('dialog', {
      name: name,
    });
  }

  /**
   * THEME HELPERS
   */
  async isDarkMode() {
    await expect(this.themeToggle).toBeChecked();
  }

  async isLightMode() {
    await expect(this.themeToggle).not.toBeChecked();
  }

  async toggleTheme() {
    await this.themeToggle.click();
  }

  /**
   * Runs the specified callback function for each theme on the page. Useful
   * for taking screenshots. Ensure that the callback includes any setup needed
   * before taking a screenshot because the dashboard reloads on changing the
   * theme.
   */
  async forEachTheme(callback: (themeName: ThemeName) => Promise<void>) {
    await this.isLightMode();
    await callback('light');

    await this.toggleTheme();
    await this.isDarkMode();
    await callback('dark');
  }

  /**
   * PANEL EDITOR HELPERS
   */

  getPanelEditor() {
    return new PanelEditor(this.panelEditor);
  }

  /**
   * PANEL GROUP HELPERS
   */

  getPanelGroup(panelGroupName: string) {
    const container = this.panelGroups.filter({ hasText: panelGroupName });
    return new PanelGroup(container);
  }

  async addPanelGroup(panelGrouName: string) {
    await this.addPanelGroupButton.click();
    const dialog = this.getDialog('add panel group');
    const nameInput = dialog.getByLabel('Name');
    await nameInput.type(panelGrouName);
    await dialog.getByRole('button', { name: 'Add' }).click();
  }

  async editPanelGroup(panelGrouName: string, { name }: PanelGroupConfig) {
    const panelGroup = this.getPanelGroup(panelGrouName);
    await panelGroup.startEditing();
    const dialog = this.getDialog('edit panel group');
    const nameInput = dialog.getByLabel('Name');
    await nameInput.clear();
    await nameInput.type(name);
    await dialog.getByRole('button', { name: 'Apply' }).click();
  }

  async deletePanelGroup(panelGroupName: string) {
    const panelGroup = this.getPanelGroup(panelGroupName);
    await panelGroup.delete();
    const dialog = this.getDialog('delete panel group');
    await dialog.getByRole('button', { name: 'Delete' }).click();
  }

  async addPanelToGroup(panelGroupName: string) {
    const panelGroup = this.getPanelGroup(panelGroupName);
    await panelGroup.addPanel();
  }

  /**
   * PANEL HELPERS
   */

  async addPanel() {
    await this.addPanelButton.click();
  }

  async addMarkdownPanel(panelName: string) {
    await this.panelEditor.isVisible();

    const panelEditor = new PanelEditor(this.panelEditor);
    await panelEditor.nameInput.type(panelName);
    await panelEditor.selectType('Markdown');
    await panelEditor.addButton.click();
    await panelEditor.isClosed();
  }

  /**
   * If the passed value is already a panel, return it. Otherwise, look the panel
   * up by name. Useful for internal helper functions that can support taking
   * a name or a panel.
   */
  private getPanelByNameOrSelf(panelNameOrPanel: PanelNameOrPanel) {
    // If the passed value is already a panel, return it. Useful for internal
    // helper functions that want to support taking a name or a panel.
    if (typeof panelNameOrPanel !== 'string') {
      return panelNameOrPanel;
    }

    return this.getPanel(panelNameOrPanel);
  }

  /**
   * Get a panel by name.
   */
  getPanel(panelName: string): Panel {
    const container = this.panels.filter({
      has: this.page.getByRole('heading', { name: panelName }),
    });
    return new Panel(container);
  }

  /**
   * Look up a panel by its index on the page. Useful for tests when the name
   * of the panel will change and cannot be relied on as a consistent locator.
   */
  getPanelByIndex(i: number) {
    return new Panel(this.panels.nth(i));
  }

  /**
   * Helper for simplifying panel editing.
   * - Starts the editing process for the specified panel by opening the panel
   *   editor.
   * - Provides the panel editor to a callback function that handles the
   *   steps to edit the panel.
   * - When the callback is fiished, applies the changes and waits for the panel
   *   editor to close.
   * @param panel - Panel to edit.
   * @param callback - Async function that is called after the panel editor is
   * opened and before the changes in the panel editor are applied.
   */
  async editPanel(panelNameOrPanel: PanelNameOrPanel, callback: (panelEditor: PanelEditor) => Promise<void>) {
    const panel = this.getPanelByNameOrSelf(panelNameOrPanel);

    await panel.startEditing();

    const panelEditor = new PanelEditor(this.panelEditor);
    await panelEditor.isVisible();

    await callback(panelEditor);

    await panelEditor.applyButton.click();
    await panelEditor.isClosed();
  }

  async removePanel(panelNameOrPanel: PanelNameOrPanel) {
    const panel = this.getPanelByNameOrSelf(panelNameOrPanel);

    panel.delete();
    const dialog = this.getDialog('delete panel');
    await dialog.getByRole('button', { name: 'Delete' }).click();
  }

  /**
   * VARIABLE HELPERS
   */

  async startEditingVariables() {
    await this.editVariablesButton.click();
    const variableEditor = this.getVariableEditor();
    await variableEditor.isVisible();
  }

  getVariableEditor() {
    return new VariableEditor(this.variableEditor);
  }

  /**
   * MOCKING NETWORK REQUESTS
   */

  /**
   * Mock responses from '/api/v1/query_range' by the query parameter in the
   * request. Useful for stabilizing charts when taking screenshots.
   */
  async mockQueryRangeRequests({ queries }: MockQueryRangeConfig) {
    // Mock data response, so we can make assertions on consistent response data.
    await this.page.route('**/api/v1/query_range', (route) => {
      const request = route.request();
      const requestPostData = request.postDataJSON();

      const requestQuery = typeof requestPostData === 'object' ? requestPostData['query'] : undefined;
      const mockQuery = queries.find((mockQueryConfig) => mockQueryConfig.query === requestQuery);

      if (mockQuery) {
        // Found a config for mocking this query. Return the mock response.
        route.fulfill(mockQuery.response);
      } else {
        // No config found. Let the request continue normally.
        route.continue();
      }
    });
  }

  async cleanupMockRequests() {
    await this.page.unroute('**/api/v1/query_range');
  }
}
