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

/**
 * The Perses App project page.
 */
export class AppProjectPage {
  readonly page: Page;

  readonly addDashboardButton: Locator;
  readonly createDashboardDialog: Locator;

  constructor(page: Page) {
    this.page = page;

    this.addDashboardButton = page.getByRole('button', { name: 'Add Dashboard' });

    this.createDashboardDialog = page.getByRole('dialog', {
      name: 'Create Dashboard',
    });
  }

  async createDashboard(name: string) {
    await this.addDashboardButton.click();

    const nameInput = this.createDashboardDialog.getByRole('textbox', {
      name: 'Name',
    });
    await nameInput.type(name);

    await this.createDashboardDialog.getByRole('button', { name: 'Add' }).click();
  }
}
