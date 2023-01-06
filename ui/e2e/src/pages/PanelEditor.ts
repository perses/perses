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

export class PanelEditor {
  readonly container: Locator;

  readonly nameInput: Locator;
  readonly descriptionInput: Locator;

  readonly addButton: Locator;
  readonly applyButton: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.nameInput = container.getByLabel('Name').first();
    this.descriptionInput = container.getByLabel('Description');

    this.addButton = container.getByRole('button', { name: 'Add', exact: true });
    this.applyButton = container.getByRole('button', { name: 'Apply', exact: true });
  }

  async isVisible() {
    // Wait for all animations to complete to avoid misclicking as the panel
    // animates in.
    await this.container.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished))
    );
  }

  async selectType(typeName: string) {
    await this.container
      .getByRole('button', {
        name: 'Type',
        exact: true,
      })
      .click();
    // Need to look up to the page because MUI uses portals for the dropdown.
    await this.container.page().getByRole('option', { name: typeName }).click();
  }

  async selectGroup(groupName: string) {
    await this.container
      .getByRole('button', {
        name: 'Group',
        exact: true,
      })
      .click();
    // Need to look up to the page because MUI uses portals for the dropdown.
    await this.container.page().getByRole('option', { name: groupName }).click();
    await expect(
      this.container.getByRole('button', {
        name: 'Group',
        exact: true,
      })
    ).toHaveText(groupName);
  }
}
