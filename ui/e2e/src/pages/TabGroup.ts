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

import { Locator, expect } from '@playwright/test';
import { PanelGroup } from './PanelGroup';

export class TabGroup extends PanelGroup {
  readonly tabBar: Locator;

  constructor(container: Locator) {
    super(container);
    // Tab layout uses a different content container than grid layout
    this.content = container.getByTestId('tab-group-content');
    this.tabBar = container.getByTestId('tab-bar');
  }

  getTab(index: number): Locator {
    return this.container.getByTestId(`tab-${index}`);
  }

  async switchToTab(index: number): Promise<void> {
    await this.getTab(index).click();
  }

  async getActiveTabIndex(): Promise<number> {
    const tabs = this.tabBar.getByRole('tab');
    const selectedStates = await tabs.evaluateAll((elements) => elements.map((el) => el.getAttribute('aria-selected')));
    const index = selectedStates.indexOf('true');
    if (index === -1) throw new Error('No active tab found');
    return index;
  }

  async getTabCount(): Promise<number> {
    return this.tabBar.getByRole('tab').count();
  }

  /**
   * Uses tab-name-{index} test-ids in edit mode, falls back to tab role text in view mode.
   */
  async getTabNames(): Promise<string[]> {
    const tabs = this.tabBar.getByRole('tab');
    const count = await tabs.count();
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameSpan = this.container.getByTestId(`tab-name-${i}`);
      if ((await nameSpan.count()) > 0) {
        names.push((await nameSpan.textContent()) ?? '');
      } else {
        names.push((await tabs.nth(i).textContent()) ?? '');
      }
    }
    return names;
  }

  async renameTab(index: number, newName: string): Promise<void> {
    await this.container.getByTestId(`tab-edit-${index}`).click();
    const dialog = this.container.page().getByRole('dialog');
    await expect(dialog).toBeVisible();
    const nameInput = dialog.getByTestId('tab-editor-name').locator('input');
    await nameInput.clear();
    await nameInput.fill(newName);
    await dialog.getByRole('button', { name: 'Apply' }).click();
  }

  async setDefaultTab(index: number): Promise<void> {
    await this.container.getByTestId(`tab-edit-${index}`).click();
    const dialog = this.container.page().getByRole('dialog');
    await expect(dialog).toBeVisible();
    const checkbox = dialog.getByTestId('tab-editor-default');
    await checkbox.click();
    await dialog.getByRole('button', { name: 'Apply' }).click();
  }

  async moveTabLeft(index: number): Promise<void> {
    await this.container.getByTestId(`tab-move-left-${index}`).click();
  }

  async moveTabRight(index: number): Promise<void> {
    await this.container.getByTestId(`tab-move-right-${index}`).click();
  }

  async addTab(): Promise<void> {
    await this.container.getByTestId('tab-add').click();
  }

  async removeTab(index: number): Promise<void> {
    await this.container.getByTestId(`tab-delete-${index}`).click();
  }

  async isDefaultTab(index: number): Promise<boolean> {
    const tab = this.getTab(index);
    const starIcon = tab.locator('[data-testid="StarIcon"]');
    return (await starIcon.count()) > 0;
  }
}
