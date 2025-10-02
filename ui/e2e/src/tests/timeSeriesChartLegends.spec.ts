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

import { mockTimeSeriesResponseWithStableValue } from '@perses-dev/internal-utils';
import { test } from '../fixtures/dashboardTest';
import { waitForStableCanvas } from '../utils';

test.use({
  dashboardName: 'TimeSeriesChartLegends',
  mockNow: 1673805600000,
});

test.describe('Dashboard: Time Series Chart Legends', () => {
  ['bottom table', 'right table', 'bottom list', 'right list'].forEach((panelName) => {
    test(`on mouse over ${panelName} legend item highlights the associated line`, async ({
      dashboardPage,
      mockNow,
    }) => {
      // Mock data response, so we can make assertions on consistent response data.

      await dashboardPage.mockQueryRangeRequests({
        queries: [
          {
            query: 'prometheus_http_requests_total',
            response: {
              status: 200,
              body: JSON.stringify(
                mockTimeSeriesResponseWithStableValue({
                  metrics: [
                    {
                      metric: {
                        __name__: 'prometheus_http_requests_total',
                        instance: 'demo.do.prometheus.io:9090',
                        job: 'prometheus',
                        handler: '/-/healthy',
                      },
                      value: '1',
                    },
                    {
                      metric: {
                        __name__: 'prometheus_http_requests_total',
                        instance: 'demo.do.prometheus.io:9090',
                        job: 'prometheus',
                        handler: '/api/v1/alerts',
                      },
                      value: '10',
                    },
                    {
                      metric: {
                        __name__: 'prometheus_http_requests_total',
                        instance: 'demo.do.prometheus.io:9090',
                        job: 'prometheus',
                        handler: '/api/v1/labels',
                      },
                      value: '100',
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

      await dashboardPage.forEachTheme(async () => {
        const timeSeriesPanel = dashboardPage.getPanelByName(panelName);
        await timeSeriesPanel.isLoaded();
        await waitForStableCanvas(timeSeriesPanel.canvas);

        const legendItemRole = panelName.includes('table') ? 'row' : 'listitem';

        const legendItems = timeSeriesPanel.container.getByRole(legendItemRole);
        await legendItems.nth(2).hover();
      });
    });
  });
});
