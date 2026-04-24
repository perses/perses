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

import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'Panels',
});

const MODIFIER = process.platform === 'darwin' ? 'Meta' : 'Control';

test.describe('Keyboard Shortcuts', () => {
  test('g then h navigates to home page', async ({ dashboardPage, page }) => {
    // Verify we are on a dashboard page first
    await expect(dashboardPage.toolbar).toBeVisible();

    // Press g then h sequence to navigate home
    await page.keyboard.press('g');
    await page.keyboard.press('h');

    // Should navigate to home page
    await page.waitForURL('/', { timeout: 5000 });
    await expect(page).toHaveURL('/');
  });

  test('Shift+? opens the help modal', async ({ dashboardPage, page }) => {
    await expect(dashboardPage.toolbar).toBeVisible();

    // Press Shift+? to open the shortcuts help modal
    await page.keyboard.press('Shift+/');

    // The help modal should appear with the title "Keyboard Shortcuts"
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toContainText('Keyboard Shortcuts');

    // Verify some expected category headings are present
    await expect(dialog).toContainText('GLOBAL');
    await expect(dialog).toContainText('TIME RANGE');
    await expect(dialog).toContainText('DASHBOARD');
    await expect(dialog).toContainText('FOCUSED PANEL');
  });

  test('d then m toggles dashboard edit mode', async ({ dashboardPage, page }) => {
    await expect(dashboardPage.toolbar).toBeVisible();
    await expect(dashboardPage.editButton).toBeVisible();

    await page.keyboard.press('d');
    await page.keyboard.press('m');

    await expect(dashboardPage.cancelButton).toBeVisible({ timeout: 5000 });
    await expect(dashboardPage.saveButton).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('d');
    await page.keyboard.press('m');

    await expect(dashboardPage.editButton).toBeVisible({ timeout: 5000 });
  });

  test('v exits panel view mode while panel editor is open', async ({ dashboardPage, page }) => {
    await dashboardPage.startEditing();

    const togglePanelViewModeButton = page.getByRole('button', { name: /toggle panel .* view mode/i }).first();
    await togglePanelViewModeButton.click();
    await expect(page).toHaveURL(/viewPanelRef=/);

    const editPanelButton = page.getByRole('button', { name: /edit panel/i }).first();
    await editPanelButton.click();
    await expect(page.getByRole('heading', { name: /Edit Panel/i })).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('v');
    await page.waitForURL((url) => !url.toString().includes('viewPanelRef='), { timeout: 5000 });
  });

  test('e closes panel editor when it is open', async ({ dashboardPage, page }) => {
    await dashboardPage.startEditing();

    const editPanelButton = page.getByRole('button', { name: /edit panel/i }).first();
    await editPanelButton.click();
    await expect(page.getByRole('heading', { name: /Edit Panel/i })).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('e');
    await expect(page.getByRole('heading', { name: /Edit Panel/i })).toBeHidden({ timeout: 5000 });
  });

  test('Mod+K opens the search dialog', async ({ dashboardPage, page }) => {
    await expect(dashboardPage.toolbar).toBeVisible();

    // Use the platform-appropriate modifier key
    await page.keyboard.press(`${MODIFIER}+k`);

    // The search dialog/bar should open
    // Look for the search input or dialog
    const searchInput = page.getByRole('combobox', { name: /search/i }).or(page.getByPlaceholder(/search/i));
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test.describe('Save shortcuts', () => {
    test.use({ modifiesDashboard: true });

    test('Mod+S triggers save on a dashboard in edit mode', async ({ dashboardPage, page }) => {
      // Enter edit mode first
      await dashboardPage.startEditing();

      // Use the platform-appropriate modifier key
      await page.keyboard.press(`${MODIFIER}+s`);

      // After Mod+S, the save action should trigger and return to view mode.
      await expect(dashboardPage.editButton).toBeVisible({ timeout: 5000 });
      await expect(dashboardPage.alert).toContainText(/successfully updated/i);
    });
  });

  test('Mod+S in view mode shows a hint and does not save', async ({ dashboardPage, page }) => {
    await expect(dashboardPage.editButton).toBeVisible();

    await page.keyboard.press(`${MODIFIER}+s`);

    await expect(dashboardPage.editButton).toBeVisible();
    await expect(dashboardPage.alert).toContainText('Enter edit mode to save this dashboard.');
  });
});
