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

import updatedDefaultsDashboard from '../data/updatedDefaultsDashboard.json';
import { test, expect } from '../fixtures/dashboardTest';

test.use({
  dashboardName: 'EditJson',
  modifiesDashboard: true,
});

test.describe('Dashboard: EditJson', () => {
  test('can save new default values from JSON editor', async ({ page, dashboardPage }) => {
    await dashboardPage.startEditing();
    await page.getByRole('button', { name: 'Edit JSON' }).click(); // TODO: move TOOLTIP_TEXT.editJson to @perses-dev/core and share constant here
    const jsonInput = dashboardPage.page.getByRole('textbox');
    await jsonInput.clear();
    await jsonInput.fill(JSON.stringify(updatedDefaultsDashboard));
    await dashboardPage.page.getByRole('button', { name: 'Apply', exact: true }).click();
    await dashboardPage.saveChanges();
    await expect(page.url()).toContain('start=5m');
    await expect(dashboardPage.timePicker).toContainText('Last 5 minutes');
    await expect(dashboardPage.page.getByRole('button', { name: 'interval', exact: true })).toContainText('5m');
  });
});
