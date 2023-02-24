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
import { mockTimeSeriesResponseWithStableValue, waitForStableCanvas } from '../utils';

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

  test(`displays single line as expected`, async ({ page, dashboardPage, mockNow }) => {
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

    await dashboardPage.forEachTheme(async (themeName) => {
      const panel = dashboardPage.getPanelByName('Single Line');
      await panel.isLoaded();
      await waitForStableCanvas(panel.canvas);

      await happoPlaywright.screenshot(page, panel.parent, {
        component: 'Time Series Chart Panel',
        variant: `Single Line [${themeName}]`,
      });
    });
  });

  test(`displays time series with custom visual options`, async ({ page, dashboardPage, mockNow }) => {
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

    await dashboardPage.forEachTheme(async (themeName) => {
      const panel = dashboardPage.getPanelByName('Single Line');
      await panel.isLoaded();
      await waitForStableCanvas(panel.canvas);

      await happoPlaywright.screenshot(page, panel.parent, {
        component: 'Time Series Chart Panel',
        variant: `Single Line [${themeName}]`,
      });
    });

    await dashboardPage.forEachTheme(async (themeName) => {
      const panel = dashboardPage.getPanelByName('Line Visual Options');
      await panel.isLoaded();
      await waitForStableCanvas(panel.canvas);

      await happoPlaywright.screenshot(page, panel.parent, {
        component: 'Time Series Chart Panel',
        variant: `Line Visual Options [${themeName}]`,
      });
    });
  });
});
