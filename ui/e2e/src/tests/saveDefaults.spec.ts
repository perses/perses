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

import { SAVE_DEFAULTS_DIALOG_TEXT } from '@perses-dev/core';
import updatedDefaultsDashboard from '../data/updatedDefaultsDashboard.json';
import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'Defaults',
  modifiesDashboard: true,
});

test.describe('Dashboard: Defaults', () => {
  test('can update default dashboard duration', async ({ page, dashboardPage }) => {
    // Default to stored duration
    await expect(dashboardPage.timePicker).toContainText('Last 1 hour');
    await expect(page.url()).toContain('start=1h');

    // Change selected relative time range
    await dashboardPage.timePicker.click();
    await page.getByRole('option', { name: 'Last 6 hours' }).click();
    await expect(page.url()).toContain('start=6h');

    // Switch to edit mode and click save
    await dashboardPage.startEditing();
    // await dashboardPage.saveChanges(); // TODO: Can saveChanges be used instead? Throws 409 error currently
    const toolbarSaveButton = dashboardPage.page.getByRole('button', { name: 'Save' });
    await toolbarSaveButton.click();

    // Save defaults confirmation dialog should open, click btn to save
    const dialogText = dashboardPage.page.getByText(SAVE_DEFAULTS_DIALOG_TEXT);
    await expect(dialogText).toBeVisible();
    const dialogSaveButton = dashboardPage.page.getByRole('button', { name: 'Save Changes' });
    await dialogSaveButton.click();

    // Confirm new duration is persisted
    await page.reload();
    await expect(page.url()).toContain('start=6h');
    await expect(dashboardPage.timePicker).toContainText('Last 6 hours');
  });

  test('can save new default duration from JSON editor', async ({ page, dashboardPage }) => {
    await dashboardPage.startEditing();
    await page.getByRole('button', { name: 'Edit JSON' }).click(); // TODO: move TOOLTIP_TEXT.editJson to @perses-dev/core and share constant here
    const jsonInput = dashboardPage.page.getByRole('textbox');
    await jsonInput.clear();
    await jsonInput.fill(JSON.stringify(updatedDefaultsDashboard));
    await dashboardPage.page.getByRole('button', { name: 'Apply', exact: true }).click();
    await dashboardPage.saveChanges();
    await expect(page.url()).toContain('start=5m');
    await expect(dashboardPage.timePicker).toContainText('Last 5 minutes');
  });
});
