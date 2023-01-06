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
import { Panel } from './Panel';

/**
 * Panel group on a dashboard page.
 */
export class PanelGroup {
  readonly container: Locator;

  readonly header: Locator;
  readonly content: Locator;
  readonly panels: Locator;
  readonly panelHeadings: Locator;

  readonly editButton: Locator;
  readonly expandButton: Locator;
  readonly collapseButton: Locator;
  readonly moveUpButton: Locator;
  readonly moveDownButton: Locator;
  readonly deleteButton: Locator;
  readonly addPanelButton: Locator;

  constructor(container: Locator) {
    this.container = container;
    this.header = container.getByTestId('panel-group-header');
    this.content = container.getByTestId('panel-group-content');

    this.editButton = this.header.getByRole('button', {
      name: 'edit group',
      exact: false,
    });
    this.moveDownButton = this.header.getByRole('button', {
      name: /move group .+ down/,
    });
    this.moveUpButton = this.header.getByRole('button', {
      name: /move group .+ up/,
    });
    this.expandButton = this.header.getByRole('button', {
      name: 'expand group',
      exact: false,
    });
    this.collapseButton = this.header.getByRole('button', {
      name: 'collapse group',
      exact: false,
    });
    this.deleteButton = this.header.getByRole('button', {
      name: 'delete group',
      exact: false,
    });
    this.addPanelButton = this.header.getByRole('button', {
      name: 'add panel to group',
    });

    this.panels = this.container.getByTestId('panel');
    this.panelHeadings = this.panels.locator('header').getByRole('heading');
  }

  isOpen() {
    return this.content.isVisible();
  }

  async isExpanded() {
    await expect(this.content).toBeVisible();
    await expect(this.collapseButton).toBeVisible();
  }

  async isCollapsed() {
    await expect(this.content).toBeHidden();
    await expect(this.expandButton).toBeVisible();
  }

  async expand() {
    await this.expandButton.click();
  }

  async collapse() {
    await this.collapseButton.click();
  }

  async startEditing() {
    await this.editButton.click();
  }

  async moveUp() {
    await this.moveUpButton.click();
  }

  async moveDown() {
    await this.moveDownButton.click();
  }

  async delete() {
    await this.deleteButton.click();
  }

  async addPanel() {
    await this.addPanelButton.click();
  }

  /**
   * Get information about the bounds of the panel group.
   */
  async getBounds() {
    const groupBounds = await this.container.boundingBox();

    // These values shouldn't be null in the cases we are using them, so thowing an error
    // in the rare care they are null. This appropriately fails the test and acts as a
    // type guard to simplify using the bounds in tests.
    if (!groupBounds) {
      throw new Error(`Unable to get bounds for panel group.`);
    }

    return groupBounds;
  }

  /**
   * Gets the percentage of the height and width of a panel within the group.
   * Useful for asserting resizing and responsive behavior.
   */
  async getPanelPercentOfBounds(panel: Panel) {
    const groupBounds = await this.getBounds();
    const panelBounds = await panel.getBounds();

    return {
      width: panelBounds.width / groupBounds.width,
      height: panelBounds.height / groupBounds.height,
    };
  }
}
