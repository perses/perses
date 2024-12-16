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

import { Locator, expect } from '@playwright/test';
import { selectMenuItem, waitForAnimations } from '../utils';

export class VariableEditor {
  readonly container: Locator;

  readonly addVariableButton: Locator;
  readonly saveButton: Locator;
  readonly addButton: Locator;
  readonly applyButton: Locator;

  readonly table: Locator;
  readonly tableRows: Locator;
  readonly tableRowHeadings: Locator;

  readonly nameInput: Locator;
  readonly displayLabelInput: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.addVariableButton = container.getByRole('button', { name: 'Add Variable' });
    this.saveButton = container.getByRole('button', { name: 'Save' });
    this.addButton = container.getByRole('button', { name: 'Add' });
    this.applyButton = container.getByRole('button', { name: 'Apply' });

    this.table = container.getByRole('table', {
      name: 'table of variables',
    });
    this.tableRows = this.table.getByRole('row');
    this.tableRowHeadings = this.tableRows.getByRole('rowheader');

    this.nameInput = container.getByLabel('Name');
    this.displayLabelInput = container.getByLabel('Display Label');
  }

  async isVisible(): Promise<void> {
    // Wait for all animations to complete to avoid misclicking as the panel
    // animates in.
    const isContainerVisible = await this.container.isVisible();

    if (isContainerVisible) {
      await waitForAnimations(this.container);
    }

    await this.container.isVisible();
  }

  async isClosed(): Promise<void> {
    // Wait for all animations to complete to avoid misclicking as the panel
    // animates out.

    const isContainerVisible = await this.container.isVisible();

    if (isContainerVisible) {
      await waitForAnimations(this.container);
    }

    await expect(this.container).toHaveCount(0);
  }

  async startAddingVariable(): Promise<void> {
    await this.addVariableButton.click();
  }

  async applyChanges(): Promise<void> {
    await this.applyButton.click();
    await this.isClosed();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async setDisplayLabel(displayLabel: string): Promise<void> {
    await this.displayLabelInput.clear();
    await this.displayLabelInput.fill(displayLabel);
  }

  async selectType(typeName: string): Promise<void> {
    await selectMenuItem(this.container, 'Type', typeName);
  }

  async selectSource(source: string): Promise<void> {
    await selectMenuItem(this.container, 'Source', source);
  }

  async setListValue(value: string): Promise<void> {
    const input = this.container.getByLabel('Values', { exact: true });
    await input.clear();
    await input.fill(value);
    await input.press('Enter');
  }

  async setTextValue(value: string): Promise<void> {
    const input = this.container.getByLabel('Value');
    await input.clear();
    await input.fill(value);
  }
}
