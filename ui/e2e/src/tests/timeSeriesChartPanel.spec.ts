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

import happoPlaywright from 'happo-playwright';
import { test } from '../fixtures/dashboardTest';
import {
  mockTimeSeriesResponseWithStableValue,
  mockTimeSeriesResponseWithNullValues,
  waitForStableCanvas,
} from '../utils';

test.use({
  dashboardName: 'TimeSeriesChartPanel',
  mockNow: 1673805600000,
});

test.describe('Dashboard: Time Series Chart Panel', () => {
  test.beforeEach(async ({ context }) => {
    await happoPlaywright.init(context);
  });

  test.afterEach(async () => {
    await happoPlaywright.finish();
  });

  ['Single Line', 'Custom Visual Options', 'Connected Nulls'].forEach((panelName) => {
    test(`displays ${panelName} as expected`, async ({ page, dashboardPage, mockNow }) => {
      // Mock data response, so we can make assertions on consistent response data.
      await dashboardPage.mockQueryRangeRequests({
        queries: [
          {
            query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
            response: {
              status: 200,
              body: JSON.stringify(
                mockTimeSeriesResponseWithStableValue({
                  metrics: [
                    {
                      metric: {
                        __name__: 'up',
                        instance: 'demo.do.prometheus.io:3000',
                        job: 'grafana',
                      },
                      value: '1',
                    },
                  ],
                  startTimeMs: mockNow - 6 * 60 * 60 * 1000,
                  endTimeMs: mockNow,
                })
              ),
            },
          },
          {
            query: 'fake_graphite_query_with_nulls',
            response: {
              status: 200,
              body: JSON.stringify(
                mockTimeSeriesResponseWithNullValues({
                  startTimeMs: mockNow - 6 * 60 * 60 * 1000,
                  endTimeMs: mockNow,
                })
              ),
            },
          },
        ],
      });

      await dashboardPage.forEachTheme(async (themeName) => {
        const timeSeriesPanel = dashboardPage.getPanelByName(panelName);
        await timeSeriesPanel.container.scrollIntoViewIfNeeded();
        await timeSeriesPanel.isLoaded();
        await waitForStableCanvas(timeSeriesPanel.canvas);

        await happoPlaywright.screenshot(page, timeSeriesPanel.parent, {
          component: 'Time Series Chart Panel',
          variant: `${panelName} [${themeName}]`,
        });
      });
    });
  });

  test('should be able to add and edit thresholds', async ({ page, dashboardPage, mockNow }) => {
    // Mock data response, so we can make assertions on consistent response data.
    await dashboardPage.mockQueryRangeRequests({
      queries: [
        {
          query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
          response: {
            status: 200,
            body: JSON.stringify(
              mockTimeSeriesResponseWithStableValue({
                metrics: [
                  {
                    metric: {
                      __name__: 'up',
                      instance: 'demo.do.prometheus.io:3000',
                      job: 'grafana',
                    },
                    value: '1',
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

    await dashboardPage.startEditing();
    await dashboardPage.editPanel('Single Line', async (panelEditor) => {
      await panelEditor.selectTab('Settings');
      await panelEditor.addThreshold();
      await panelEditor.addThreshold();
      await panelEditor.editThreshold('T1', '50');
      await panelEditor.toggleThresholdModes('Percent');
      await panelEditor.container.getByLabel('Max').fill('5');
      await panelEditor.openThresholdColorPicker('T2');
      const colorPicker = dashboardPage.page.getByTestId('threshold color picker');
      await colorPicker.isVisible();
      const colorInput = colorPicker.getByRole('textbox', { name: 'enter hex color' });
      await colorInput.clear();
      await colorInput.type('EE6C6C', { delay: 100 });
      await page.keyboard.press('Escape');
    });
    const panel = dashboardPage.getPanelByName('Single Line');
    await panel.isLoaded();
    await waitForStableCanvas(panel.canvas);

    await happoPlaywright.screenshot(page, panel.parent, {
      component: 'Time Series Chart Panel',
      variant: `Single Line with Percent Threshold`,
    });
  });
});
