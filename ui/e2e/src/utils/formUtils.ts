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

/**
 * Util to help with selecting a menu item in a MUI select.
 * @param container - Locator to look within for the select.
 * @param selectName - Name of the select.
 * @param itemName - Name of the menu item to pick within the select.
 */
export async function selectMenuItem(container: Locator, selectName: string | RegExp, itemName: string | RegExp) {
  await container
    .getByRole('button', {
      name: selectName,
    })
    .click();
  // Need to look up to the page because MUI uses portals for the dropdown.
  await container.page().getByRole('option', { name: itemName }).click();
}
