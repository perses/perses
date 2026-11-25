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

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures/persesTest';
import { AppHomePage } from '../pages';

// The background of the loading screen of index.html: light-dark(#ffffff, #151721).
const LOADING_SCREEN_BACKGROUNDS = {
  light: 'rgb(255, 255, 255)',
  dark: 'rgb(21, 23, 33)',
};

/**
 * Prevents the app bundle from loading, so the loading screen stays displayed instead of being replaced by the app.
 */
async function blockApp(page: Page): Promise<void> {
  await page.route(/\/main(\.[0-9a-f]+)?\.js$/, (route) => route.abort());
}

test.describe('loading screen', () => {
  for (const osTheme of ['light', 'dark'] as const) {
    test(`follows the ${osTheme} theme of the OS when no theme is chosen in Perses`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: osTheme });
      await blockApp(page);
      await page.goto('/');

      await expect(page.locator('#loader')).toHaveCSS('background-color', LOADING_SCREEN_BACKGROUNDS[osTheme]);
    });
  }

  for (const [osTheme, chosenTheme] of [
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const) {
    test(`uses the ${chosenTheme} theme chosen in Perses over the ${osTheme} theme of the OS`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: osTheme });
      const homePage = new AppHomePage(page);
      await homePage.goto();
      await homePage.switchTheme(chosenTheme);

      await blockApp(page);
      await page.reload();

      await expect(page.locator('#loader')).toHaveCSS('background-color', LOADING_SCREEN_BACKGROUNDS[chosenTheme]);
    });
  }
});
