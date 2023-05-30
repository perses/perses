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

import { expect, test } from '../fixtures/dashboardTest';
import { parseDateIntoTimeZone } from '../utils';

test.use({
  dashboardName: 'Panels',

  // Friday, February 10, 2023 12:00:15 PM GMT-08:00
  mockNow: 1676059215000,
});

test.describe('Time Picker', () => {
  test('defaults to 6 hours', async ({ page, dashboardPage }) => {
    await expect(dashboardPage.timePicker).toContainText('6 hours');
    expect(page.url()).toContain('start=6h');
  });

  test.describe('can select a custom time range', () => {
    test('using interactive calendar and clock', async ({ page, dashboardPage, timezoneId }) => {
      await dashboardPage.timePicker.click();

      await page.getByRole('option', { name: 'Custom time range' }).click();
      await page.getByRole('button', { name: 'Feb 4, 2023' }).click();

      // The a11y markup on this clock face is really hard to work with, so using
      // a rare forced click here.
      await page
        .getByRole('option', {
          name: '3 hours',
        })
        .click({
          // eslint-disable-next-line playwright/no-force-option
          force: true,
        });

      // The a11y markup on this clock face is really hard to work with, so using
      // a rare forced click here.
      await page
        .getByRole('option', {
          name: '15 minutes',
        })
        .click({
          // eslint-disable-next-line playwright/no-force-option
          force: true,
        });

      await page.getByRole('button', { name: 'Feb 9, 2023' }).click();
      // The a11y markup on this clock face is really hard to work with, so using
      // a rare forced click here.
      await page
        .getByRole('option', {
          name: '7 hours',
        })
        .click({
          // eslint-disable-next-line playwright/no-force-option
          force: true,
        });

      // The a11y markup on this clock face is really hard to work with, so using
      // a rare forced click here.
      await page
        .getByRole('option', {
          name: '55 minutes',
        })
        .click({
          // eslint-disable-next-line playwright/no-force-option
          force: true,
        });

      await page.getByRole('button', { name: 'Apply' }).click();

      const expectedStart = '2023-02-04 03:15:15';
      const expectedEnd = '2023-02-09 19:55:15';
      const expectedTimeRange = `${expectedStart} - ${expectedEnd}`;

      // Time picker dropdown shows the new time range
      await expect(page.getByRole('option', { name: expectedTimeRange })).toBeVisible();

      // Dismiss dropdown. This happens automatically when these steps are done
      // manually, but is required in playwright. Guessing it is something
      // subtle with the click targets and/or speed of actions.
      await page.keyboard.press('Escape');

      // Time picker shows the new time range.
      await expect(dashboardPage.timePicker).toContainText(expectedTimeRange);

      const expectedStartMs = parseDateIntoTimeZone(expectedStart, timezoneId).valueOf();
      const expectedEndMs = parseDateIntoTimeZone(expectedEnd, timezoneId).valueOf();

      expect(page.url()).toContain(`start=${expectedStartMs}`);
      expect(page.url()).toContain(`end=${expectedEndMs}`);
    });

    test('using text input', async ({ page, dashboardPage, timezoneId }) => {
      await dashboardPage.timePicker.click();

      await page.getByRole('option', { name: 'Custom time range' }).click();

      const startTimeInput = page.getByLabel('Start Time');
      await startTimeInput.clear();
      await startTimeInput.type('2023-01-15 13:05:00');

      const endTimeInput = page.getByLabel('End Time');
      await endTimeInput.clear();
      await endTimeInput.type('2023-02-01 10:00:00');

      await page.getByRole('button', { name: 'Apply' }).click();

      const expectedStart = '2023-01-15 13:05:00';
      const expectedEnd = '2023-02-01 10:00:00';
      const expectedTimeRange = `${expectedStart} - ${expectedEnd}`;

      // Time picker dropdown shows the new time range
      await expect(page.getByRole('option', { name: expectedTimeRange })).toBeVisible();

      // Dismiss dropdown. This happens automatically when these steps are done
      // manually, but is required in playwright. Guessing it is something
      // subtle with the click targets and/or speed of actions.
      await page.keyboard.press('Escape');

      // Time picker shows the new time range.
      await expect(dashboardPage.timePicker).toContainText(expectedTimeRange);

      const expectedStartMs = parseDateIntoTimeZone(expectedStart, timezoneId).valueOf();
      const expectedEndMs = parseDateIntoTimeZone(expectedEnd, timezoneId).valueOf();

      expect(page.url()).toContain(`start=${expectedStartMs}`);
      expect(page.url()).toContain(`end=${expectedEndMs}`);
    });

    test('and cancel to keep the previous time range', async ({ dashboardPage, page }) => {
      await dashboardPage.timePicker.click();

      await page.getByRole('option', { name: 'Custom time range' }).click();

      const startTimeInput = page.getByLabel('Start Time');
      await startTimeInput.clear();
      await startTimeInput.type('2023-01-15 13:05:00');

      const endTimeInput = page.getByLabel('End Time');
      await endTimeInput.clear();
      await endTimeInput.type('2023-02-01 10:00:00');

      await page.getByRole('button', { name: 'Cancel' }).click();

      // Time picker dropdown shows custom time range option
      await expect(page.getByRole('option', { name: 'Custom time range' })).toBeVisible();

      // Dismiss dropdown. This happens automatically when these steps are done
      // manually, but is required in playwright. Guessing it is something
      // subtle with the click targets and/or speed of actions.
      await page.keyboard.press('Escape');

      // Time picker shows the original time range.
      await expect(dashboardPage.timePicker).toContainText('6 hours');
      expect(page.url()).toContain('start=6h');
      expect(page.url()).not.toContain('end=');
    });
  });
});
