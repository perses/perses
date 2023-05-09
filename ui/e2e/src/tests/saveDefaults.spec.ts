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

import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'Defaults',
  modifiesDashboard: true,
});

test.describe('Dashboard: Defaults', () => {
  test('can update saved dashboard duration', async ({ page, dashboardPage }) => {
    await expect(dashboardPage.timePicker).toContainText('Last 1 hour');
    await expect(page.url()).toContain('start=1h');

    await dashboardPage.timePicker.click();
    await page.getByRole('option', { name: 'Last 6 hours' }).click();
    await expect(page.url()).toContain('start=6h');

    await dashboardPage.startEditing();
    // await dashboardPage.saveChanges(); // TODO: can standard dashboardPage saveChanges helper be used?
    const toolbarSaveButton = dashboardPage.page.getByRole('button', { name: 'Save' });
    await toolbarSaveButton.click();

    // TODO: share with dialog, move type to core
    const dialogInfoText =
      'It seems like you have made some changes to the dashboard, including the time period or variable values. Would you like to save these?';
    const dialogText = dashboardPage.page.getByText(dialogInfoText);
    await expect(dialogText).toBeVisible();

    const dialogSaveButton = dashboardPage.page.getByRole('button', { name: 'Save Changes' });
    await dialogSaveButton.click();
    console.log(dialogSaveButton);

    // confirm new duration is persisted
    await page.reload();
    await expect(page.url()).toContain('start=6h');
    await expect(dashboardPage.timePicker).toContainText('Last 6 hours');
  });
});
