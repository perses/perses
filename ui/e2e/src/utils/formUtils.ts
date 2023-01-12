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
