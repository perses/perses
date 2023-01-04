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

import { Page, Locator } from '@playwright/test';
import { PanelEditor } from './PanelEditor';
import { PanelGroup } from './PanelGroup';

type PanelGroupConfig = {
  name: string;
};

/**
 * Perses App dashboard page.
 */
export class DashboardPage {
  readonly page: Page;

  readonly editButton: Locator;
  readonly cancelButton: Locator;
  readonly addPanelGroupButton: Locator;
  readonly addPanelButton: Locator;

  readonly panelGroups: Locator;
  readonly panelGroupHeadings: Locator;

  readonly panels: Locator;
  readonly panelHeadings: Locator;

  readonly panelEditor: Locator;

  constructor(page: Page) {
    this.page = page;

    this.editButton = page.getByRole('button', { name: 'Edit' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.addPanelGroupButton = page.getByRole('button', { name: 'Add Panel Group' });

    // Needed to select "Add Panel" group button and NOT "Add Panel Group."
    // Exact match on "Add Panel" does not work in some situations, possibly
    // because of other content like icons inside the button.
    this.addPanelButton = page.getByRole('button', { name: 'Add panel' }).first();

    this.panelGroups = page.getByTestId('panel-group');
    this.panelGroupHeadings = this.panelGroups.getByTestId('panel-group-header').getByRole('heading', { level: 2 });

    this.panels = page.getByTestId('panel');
    this.panelHeadings = this.panels.locator('header').getByRole('heading');

    this.panelEditor = page.getByTestId('panel-editor');
  }

  async startEditing() {
    await this.editButton.click();
    await this.cancelButton.isVisible();
  }

  getDialog(name: string) {
    return this.page.getByRole('dialog', {
      name: name,
    });
  }

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

  getPanel(panelName: string) {
    return this.panels.filter({
      has: this.page.getByRole('heading', { name: panelName }),
    });
  }

  async addPanel() {
    await this.addPanelButton.click();
  }

  async addMarkdownPanel(panelName: string) {
    await this.panelEditor.isVisible();

    const panelEditor = new PanelEditor(this.panelEditor);
    await panelEditor.nameInput.type(panelName);
    await panelEditor.selectType('Markdown');
    await panelEditor.addButton.click();
  }
}
