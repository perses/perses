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

export class DatasourceEditor {
  readonly container: Locator;

  readonly saveButton: Locator;

  readonly nameInput: Locator;
  readonly displayLabelInput: Locator;
  readonly descriptionInput: Locator;

  readonly isDefaultSwitch: Locator;

  // TODO the below locators are specific to the Prom datasource and should be moved to a plugin package instead
  readonly scrapeIntervalInput: Locator;
  readonly urlInput: Locator;

  constructor(container: Locator) {
    this.container = container;

    this.saveButton = container.getByRole('button', { name: 'Save' });

    this.nameInput = container.getByLabel('Name');
    this.displayLabelInput = container.getByLabel('Display Label');
    this.descriptionInput = container.getByLabel('Description');

    this.isDefaultSwitch = container.getByLabel('Set as default');

    this.scrapeIntervalInput = container.getByLabel('Scrape Interval');
    this.urlInput = container.getByLabel('URL');
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.type(name);
  }

  async setDisplayLabel(displayLabel: string): Promise<void> {
    await this.displayLabelInput.clear();
    await this.displayLabelInput.type(displayLabel);
  }

  async setDescription(description: string): Promise<void> {
    await this.descriptionInput.clear();
    await this.descriptionInput.type(description);
  }

  async setDefault(isDefault: boolean): Promise<void> {
    if (isDefault) {
      await this.isDefaultSwitch.check();
    } else {
      await this.isDefaultSwitch.uncheck();
    }
  }

  async setScrapeInterval(scrapeInterval: string): Promise<void> {
    await this.scrapeIntervalInput.clear();
    await this.scrapeIntervalInput.type(scrapeInterval);
  }

  async setURL(url: string): Promise<void> {
    await this.urlInput.clear();
    await this.urlInput.type(url);
  }
}
