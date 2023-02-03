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
  dashboardName: 'StatChartPanel',
  mockNow: 1674779813307,
});

test.describe('Dashboard: Stat Chart Panel', () => {
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
          query: 'prometheus_http_requests_total{instance="demo.do.prometheus.io:9090",code!="200"}',
          response: {
            status: 200,
            body: JSON.stringify(
              mockTimeSeriesResponseWithStableValue({
                metrics: [
                  {
                    metric: {
                      code: '302',
                      handler: '/',
                      instance: 'demo.do.prometheus.io:9090',
                    },
                    value: '3',
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
      const panel = dashboardPage.getPanel('Simple Stat');
      await panel.isLoaded();
      await waitForStableCanvas(panel.canvas);

      await happoPlaywright.screenshot(page, panel.parent, {
        component: 'Stat Chart Panel',
        variant: `Single Stat [${themeName}]`,
      });
    });
  });
});
