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

import { expect } from '@playwright/test';
import happoPlaywright from 'happo-playwright';
import { test } from '../fixtures/dashboardTest';
import { DashboardPage } from '../pages';
import { mockTimeSeriesResponseWithStableValue, waitForStableCanvas } from '../utils';

test.use({
  dashboardName: 'GaugeChartPanel',
  mockNow: 1674778958245,
});

test.describe('Dashboard: Gauge Chart Panel', () => {
  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  test(`displays as expected`, async ({ page, dashboardPage, mockNow }) => {
    await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);

    await dashboardPage.forEachTheme(async (themeName) => {
      const panel = dashboardPage.getPanelByName('Single Gauge');
      await panel.isLoaded();
      // Wait for gauge animation to finish before taking a screenshot.
      await waitForStableCanvas(panel.canvas);

      await happoPlaywright.screenshot(page, panel.parent, {
        component: 'Gauge Chart Panel',
        variant: `Single Gauge [${themeName}]`,
      });
    });
  });

  test.describe('Thresholds', () => {
    test('should be able to add absolute threshold', async ({ page, dashboardPage, mockNow }) => {
      await dashboardPage.forEachTheme(async (themeName) => {
        await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);

        await dashboardPage.startEditing();
        await dashboardPage.editPanel('Single Gauge', async (panelEditor) => {
          await panelEditor.selectTab('Settings');
          await panelEditor.addThreshold();
          await panelEditor.editThreshold('T2', '40');
          await panelEditor.addThreshold();
        });
        const panel = dashboardPage.getPanelByName('Single Gauge');
        await panel.isLoaded();
        // Wait for gauge animation to finish before taking a screenshot.
        await waitForStableCanvas(panel.canvas);

        await happoPlaywright.screenshot(page, panel.parent, {
          component: 'Gauge Chart Panel',
          variant: `Single Gauge with Absolute Thresholds [${themeName}]`,
        });
      });
    });

    test('should be able to add percent threshold', async ({ page, dashboardPage, mockNow }) => {
      await dashboardPage.forEachTheme(async (themeName) => {
        await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);
        await dashboardPage.startEditing();
        await dashboardPage.editPanel('Single Gauge', async (panelEditor) => {
          await panelEditor.selectTab('Settings');
          await panelEditor.toggleThresholdModes('Percent');
          await panelEditor.editThreshold('T1', '50');
          await panelEditor.container.getByLabel('Max').fill('200');
        });
        const panel = dashboardPage.getPanelByName('Single Gauge');
        await panel.isLoaded();
        // Wait for gauge animation to finish before taking a screenshot.
        await waitForStableCanvas(panel.canvas);

        await happoPlaywright.screenshot(page, panel.parent, {
          component: 'Gauge Chart Panel',
          variant: `Single Gauge with Percent Thresholds [${themeName}]`,
        });
      });
    });

    test('should be able to delete threshold', async ({ dashboardPage, mockNow }) => {
      await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);

      await dashboardPage.startEditing();
      await dashboardPage.editPanel('Single Gauge', async (panelEditor) => {
        await panelEditor.selectTab('Settings');
        await panelEditor.addThreshold();
        await panelEditor.addThreshold();
        await expect(panelEditor.container.getByLabel(/^T[1-9]/)).toHaveCount(3);
        await panelEditor.deleteThreshold('T2');
        await expect(panelEditor.container.getByLabel(/^T[1-9]/)).toHaveCount(2);
      });
    });

    test('should be able to change threshold color to purple', async ({ page, dashboardPage, mockNow }) => {
      await dashboardPage.forEachTheme(async (themeName) => {
        await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);
        await dashboardPage.startEditing();
        await dashboardPage.editPanel('Single Gauge', async (panelEditor) => {
          await panelEditor.selectTab('Settings');
          await panelEditor.openThresholdColorPicker('T1');
          const colorPicker = dashboardPage.page.getByTestId('threshold color picker');
          await colorPicker.isVisible();
          const colorInput = colorPicker.getByRole('textbox', { name: 'enter hex color' });
          await colorInput.clear();
          await colorInput.type('8457c2', { delay: 100 });
          await page.keyboard.press('Escape');
        });
        const panel = dashboardPage.getPanelByName('Single Gauge');
        await panel.isLoaded();
        // Wait for gauge animation to finish before taking a screenshot.
        await waitForStableCanvas(panel.canvas);

        await happoPlaywright.screenshot(page, panel.parent, {
          component: 'Gauge Chart Panel',
          variant: `Single Gauge with Purple Threshold [${themeName}]`,
        });
      });
    });

    test('should be able to change default threshold color', async ({ page, dashboardPage, mockNow }) => {
      await dashboardPage.forEachTheme(async (themeName) => {
        await mockGaugeChartQueryRangeRequest(dashboardPage, mockNow);
        await dashboardPage.startEditing();
        await dashboardPage.editPanel('Single Gauge', async (panelEditor) => {
          await panelEditor.selectTab('Settings');
          await panelEditor.openThresholdColorPicker('default');
          const colorPicker = dashboardPage.page.getByTestId('threshold color picker');
          await colorPicker.isVisible();
          const colorInput = colorPicker.getByRole('textbox', { name: 'enter hex color' });
          await colorInput.clear();
          await colorInput.type('e3abab', { delay: 100 });
          await page.keyboard.press('Escape');
        });
        const panel = dashboardPage.getPanelByName('Single Gauge');
        await panel.isLoaded();
        // Wait for gauge animation to finish before taking a screenshot.
        await waitForStableCanvas(panel.canvas);

        await happoPlaywright.screenshot(page, panel.parent, {
          component: 'Gauge Chart Panel',
          variant: `Single Gauge with New Default Threshold Color [${themeName}]`,
        });
      });
    });
  });
});

async function mockGaugeChartQueryRangeRequest(page: DashboardPage, mockNow: number) {
  // Mock data response, so we can make assertions on consistent response data.
  await page.mockQueryRangeRequests({
    queries: [
      {
        query:
          '100 - ((node_memory_MemAvailable_bytes{env="demo", instance="demo.do.prometheus.io:9100"} * 100) / node_memory_MemTotal_bytes{env="demo", instance="demo.do.prometheus.io:9100"})',
        response: {
          status: 200,
          body: JSON.stringify(
            mockTimeSeriesResponseWithStableValue({
              metrics: [
                {
                  metric: {
                    env: 'demo',
                    instance: 'demo.do.prometheus.io:9100',
                    job: 'node',
                  },
                  value: '64.5',
                },
              ],
              startTimeMs: mockNow - 6 * 60 * 60 * 1000,
              endTimeMs: mockNow,
            })
          ),
        },
      },
    ],
  });
}
