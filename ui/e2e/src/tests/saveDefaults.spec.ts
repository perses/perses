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

  // test('change duration from JSON editor', async ({ page, dashboardPage }) => {
  //   // TODO: change duration from JSON editor
  //   // TODO: change variables and check if default is persisted
  //   // TODO: change variables from JSON editor
  // });
});
