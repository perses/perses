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
  dashboardName: 'Panels',

  // Friday, February 10, 2023 12:00:15 PM GMT-08:00
  mockNow: 1676059215000,
});

test.describe('Refresh Interval Picker', () => {
  test('defaults to Off', async ({ page, dashboardPage }) => {
    await expect(dashboardPage.refreshIntervalPicker).toContainText('Off');
    expect(page.url()).toContain('refresh=0s');
  });
  test.describe('can select refresh interval', () => {
    test('changing to 5s refresh', async ({ page, dashboardPage }) => {
      await dashboardPage.refreshIntervalPicker.click();
      await page.getByRole('option', { name: '5s', exact: true }).click();
      expect(page.url()).toContain('refresh=5s');
    });
  });
});
