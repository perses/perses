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

export class PanelEditor {
  readonly container: Locator;

  readonly nameInput: Locator;
  readonly descriptionInput: Locator;

  readonly addButton: Locator;
  readonly applyButton: Locator;
  readonly cancelButton: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.nameInput = container.getByLabel('Name').first();
    this.descriptionInput = container.getByLabel('Description');

    this.addButton = container.getByRole('button', { name: 'Add', exact: true });
    this.applyButton = container.getByRole('button', { name: 'Apply', exact: true });
    this.cancelButton = container.getByRole('button', { name: 'Cancel', exact: true });
  }

  async isVisible() {
    // Wait for all animations to complete to avoid misclicking as the panel
    // animates in.
    await waitForAnimations(this.container);
    await this.container.isVisible();
  }

  async isClosed() {
    // Wait for all animations to complete to avoid misclicking as the panel
    // animates out.
    await waitForAnimations(this.container);
    await expect(this.container).toHaveCount(0);
  }

  async selectType(typeName: string) {
    // Use a regex for this selector to avoid also selecting "Group type"
    await selectMenuItem(this.container, /^Type/, typeName);
  }

  async selectGroup(groupName: string) {
    await selectMenuItem(this.container, 'Group', groupName);

    await expect(
      this.container.getByRole('button', {
        name: 'Group',
        exact: true,
      })
    ).toHaveText(groupName);
  }

  async selectTab(tabName: string) {
    await this.container.getByRole('tab', { name: tabName }).click();
  }

  /**
   * THRESHOLDS EDITOR HELPERS
   */
  async addThreshold() {
    await this.container.getByRole('button', { name: 'add threshold' }).click();
  }

  async deleteThreshold(label: string) {
    await this.container.getByRole('button', { name: `delete threshold ${label}` }).click();
  }

  async editThreshold(label: string, value: string) {
    const input = this.container.getByLabel(label);
    await input.clear();
    await input.type(value);
  }

  async openThresholdColorPicker(label: string) {
    const openColorPickerButton = this.container.getByRole('button', { name: `change threshold ${label} color` });
    await openColorPickerButton.click();
  }

  async toggleThresholdModes(mode: 'Absolute' | 'Percent') {
    await this.container.getByRole('button', { name: mode === 'Percent' ? 'percent' : 'absolute' }).click();
  }
}
