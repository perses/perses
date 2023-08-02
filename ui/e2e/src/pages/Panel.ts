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

type resizePanelOptions = {
  width: number;
  height: number;
};

/**
 * Panel on a dashboard page.
 */
export class Panel {
  readonly container: Locator;
  readonly parent: Locator;

  readonly editButton: Locator;
  readonly deleteButton: Locator;
  readonly duplicateButton: Locator;

  readonly resizeHandle: Locator;

  readonly figure: Locator;
  readonly canvas: Locator;
  readonly loader: Locator;

  constructor(container: Locator) {
    this.container = container;

    // Useful for visual testing because the parent contains the height and
    // width setting.
    this.parent = this.container.locator('..');

    this.deleteButton = this.container.getByRole('button', {
      name: 'delete panel',
    });
    this.editButton = this.container.getByRole('button', {
      name: 'edit panel',
    });
    this.duplicateButton = this.container.getByRole('button', {
      name: 'duplicate panel',
    });

    // Need to look up to panel draggable parent first to get the resize handle.
    // The classname selector here is not ideal, but it's all that is available
    // because this lives deeper in another library.
    this.resizeHandle = this.container.locator('..').locator('..').locator('.react-resizable-handle');

    this.figure = this.container.getByRole('figure');
    this.canvas = this.container.locator('canvas');
    this.loader = this.container.locator('[aria-label*=Loading]');
  }

  async isLoaded() {
    // Wait for the figure to have at least one visible child that is not the loader.
    await expect(async () => {
      await expect(this.loader).toHaveCount(0);

      const figureChildren = this.figure.locator('*:visible');
      expect(await figureChildren.count()).toBeGreaterThan(0);

      await expect(this.loader).toHaveCount(0);
    }).toPass();

    // Scroll into view to make sure the panel is visible and to get a free
    // "stable" check. Consider replacing this with a baked in "stable" check
    // when one is available.
    // https://github.com/microsoft/playwright/issues/15195#issuecomment-1176370571
    await this.figure.scrollIntoViewIfNeeded();
  }

  async startEditing() {
    await this.editButton.click();
  }

  async delete() {
    await this.deleteButton.click();
  }

  /**
   * Get information about the bounds of the panel.
   */
  async getBounds() {
    const panelBounds = await this.container.boundingBox();

    // These values shouldn't be null in the cases we are using them, so thowing an error
    // in the rare care they are null. This appropriately fails the test and acts as a
    // type guard to simplify using the bounds in tests.
    if (!panelBounds) {
      throw new Error(`Unable to get bounds for panel.`);
    }

    return panelBounds;
  }

  /**
   * Resizes the specified panel to the provided dimensions.
   */
  async resize({ width, height }: resizePanelOptions) {
    const currentBounds = await this.getBounds();

    // Adjust positions based on current position and size of panel.
    const currentRight = currentBounds.x + currentBounds.width;
    const currentBottom = currentBounds.y + currentBounds.height;
    const x = currentRight + (width - currentBounds.width);
    const y = currentBottom + (height - currentBounds.height);

    await this.resizeHandle.hover();
    await this.container.page().mouse.down();
    await this.container.page().mouse.move(x, y);
    await this.container.page().mouse.up();
  }
}
