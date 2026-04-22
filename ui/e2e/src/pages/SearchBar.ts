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

/**
 * Page object for the SearchBar modal component.
 */
export class SearchBar {
  readonly page: Page;
  readonly modal: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[role="presentation"]');
    this.searchInput = this.modal.getByPlaceholder('What are you looking for?');
  }

  async open(): Promise<void> {
    const searchBarButton = this.page.getByRole('button', { name: /Search\.\.\./ });
    await searchBarButton.click();
  }

  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
  }

  getDashboardLink(projectName: string, dashboardName: string): Locator {
    return this.modal.locator(`a[href*="/projects/${projectName}/dashboards/${dashboardName}" i]`);
  }

  getDashboardsHeading(): Locator {
    return this.modal.getByRole('heading', { name: 'Dashboards' });
  }

  getProjectsHeading(): Locator {
    return this.modal.getByRole('heading', { name: 'Projects' });
  }

  getNoResultsMessage(query: string): Locator {
    return this.modal.getByText(new RegExp(`No records found for ${query}`));
  }

  getSeeMoreButton(): Locator {
    return this.modal.getByRole('button', { name: /see more\.\.\./i });
  }

  async clickSeeMoreIfPresent(): Promise<void> {
    const seeMoreButton = this.getSeeMoreButton();
    if (await seeMoreButton.isVisible()) {
      await seeMoreButton.click();
    }
  }
}
