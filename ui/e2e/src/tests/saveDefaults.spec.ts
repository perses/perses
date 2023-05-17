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

const TEXT_VARIABLE_UPDATED_VALUE = 'new';

test.use({
  dashboardName: 'Defaults',
  modifiesDashboard: true,
});

test.describe('Dashboard: Defaults', () => {
  test('can default to stored duration', async ({ page, dashboardPage }) => {
    await expect(dashboardPage.timePicker).toContainText('Last 1 hour');
    await expect(page.url()).toContain('start=1h');
  });

  test('can update default dashboard duration', async ({ page, dashboardPage }) => {
    const initialDashboardUrl = await page.url();
    // Change selected relative time range
    await dashboardPage.timePicker.click();
    await page.getByRole('option', { name: 'Last 6 hours' }).click();
    await expect(page.url()).toContain('start=6h');

    // Changed selected interval variable
    await expect(dashboardPage.variableListItems).toContainText(['1m']);
    await dashboardPage.page
      .getByRole('button', {
        name: 'interval',
      })
      .click();
    await dashboardPage.page.getByRole('option', { name: '5m' }).click();

    // Change text variable
    const textVariableInput = await dashboardPage.page.getByRole('textbox', { name: 'Text variable' });
    await textVariableInput.clear();
    await textVariableInput.type(TEXT_VARIABLE_UPDATED_VALUE, { delay: 100 });

    // Switch to edit mode and click save
    await dashboardPage.startEditing();
    const toolbarSaveButton = await dashboardPage.page.getByRole('button', { name: 'Save' });
    await toolbarSaveButton.click();

    // Save defaults confirmation dialog should open, click btn to save
    const dialogText = await dashboardPage.page.getByText(SAVE_DEFAULTS_DIALOG_TEXT);
    await expect(dialogText).toBeVisible();
    const dialogSaveButton = await dashboardPage.page.getByRole('button', { name: 'Save Changes' });
    await dialogSaveButton.click();

    // Confirm correct default list and text variables are persisted
    await page.goto(initialDashboardUrl);
    await expect(page.url()).toContain('start=6h');
    await expect(page.url()).toContain(TEXT_VARIABLE_UPDATED_VALUE);
    await expect(dashboardPage.timePicker).toContainText('Last 6 hours');
    await expect(dashboardPage.variableListItems).toContainText(['5m']);
  });
});
