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

import { Locator } from '@playwright/test';
import { selectMenuItem } from '../utils';

export class DatasourceEditor {
  readonly container: Locator;

  readonly createButton: Locator;

  readonly nameInput: Locator;
  readonly displayLabelInput: Locator;
  readonly descriptionInput: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.createButton = container.getByRole('button', { name: 'Create' });

    this.nameInput = container.getByLabel('Name');
    this.displayLabelInput = container.getByLabel('Display Label');
    this.descriptionInput = container.getByLabel('Description');
  }

  async setName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.type(name);
  }

  async setDisplayLabel(displayLabel: string) {
    await this.displayLabelInput.clear();
    await this.displayLabelInput.type(displayLabel);
  }

  async setDescription(description: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.type(description);
  }

  async selectDefault(isDefault: string) {
    await selectMenuItem(this.container, 'Default', isDefault);
  }
}
