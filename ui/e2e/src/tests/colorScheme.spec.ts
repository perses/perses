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

import { expect, test } from '@playwright/test';

import { AppHomePage } from '../pages';

test.describe('color scheme', () => {
  for (const [osTheme, chosenTheme] of [
    ['light', 'dark'],
    ['dark', 'light'],
  ] as const) {
    test(`follows the ${chosenTheme} theme chosen in Perses over the ${osTheme} theme of the OS`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: osTheme });
      // The theme chosen during a previous visit, stored by the app (see DARK_MODE_PREFERENCE_KEY in DarkMode.tsx).
      await page.addInitScript((isDarkModeEnabled) => {
        window.localStorage.setItem('PERSES_ENABLE_DARK_MODE', JSON.stringify(isDarkModeEnabled));
      }, chosenTheme === 'dark');
      await new AppHomePage(page).goto();

      // The scrollbars of the page follow the color scheme of the root element.
      await expect(page.locator('html')).toHaveCSS('color-scheme', chosenTheme);
    });
  }
});
