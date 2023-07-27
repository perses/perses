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

import type { Meta, StoryObj } from '@storybook/react';
import { DEFAULT_CALCULATION } from '@perses-dev/core';
import { BarChart } from '@perses-dev/panels-plugin';
import {
  WithDataQueries,
  WithPluginRegistry,
  WithTimeRange,
  WithPluginSystemTemplateVariables,
  WithPluginSystemDatasourceStore,
} from '@perses-dev/plugin-system/src/stories/shared-utils';
import { mockTimeSeriesResponseWithManySeries } from '@perses-dev/internal-utils';
import { mockQueryRangeRequests, waitForStableCanvas, WithQueryClient, WithQueryParams } from '@perses-dev/storybook';

// Mock time range values used for mocking the time range in the system and
// mock data responses to ensure consistent results when viewing and taking
// visual testing snapshots of stories.
// Currently has a 6 hour time range.
const TIMESERIES_EXAMPLE_MOCK_END = 1673805600000;
const TIMESERIES_EXAMPLE_MOCK_START = TIMESERIES_EXAMPLE_MOCK_END - 6 * 60 * 60 * 1000;

/**
 * The panel component for the `BarChart` panel plugin.
 *
 * This component is not intended to be used directly. It is documented in storybook
 * to provide an example of what the plugin panel component looks like.
 */
const meta: Meta<typeof BarChart.PanelComponent> = {
  component: BarChart.PanelComponent,
  argTypes: {},
  parameters: {
    withDataQueries: {
      props: {
        definitions: [
          {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
            },
          },
        ],
      },
    },
    withTimeRange: {
      props: {
        initialTimeRange: {
          start: new Date(TIMESERIES_EXAMPLE_MOCK_START),
          end: new Date(TIMESERIES_EXAMPLE_MOCK_END),
        },
      },
    },
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas', {
          expectedCount: 1,
        });
      },
    },
    msw: {
      handlers: {
        queryRange: mockQueryRangeRequests({
          queries: [
            {
              query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 12,
                  totalDatapoints: 1000,
                }),
              },
            },
          ],
        }),
      },
    },
  },
  decorators: [
    WithDataQueries,
    WithPluginSystemTemplateVariables,
    WithPluginSystemDatasourceStore,
    WithPluginRegistry,
    WithTimeRange,
    WithQueryClient,
    WithQueryParams,
  ],
  render: (args) => {
    return <BarChart.PanelComponent {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof BarChart.PanelComponent>;

export const Primary: Story = {
  args: {
    contentDimensions: {
      width: 800,
      height: 400,
    },
    spec: {
      calculation: DEFAULT_CALCULATION,
      unit: { abbreviate: false, kind: 'Decimal' },
      sort: 'desc',
      mode: 'percentage',
    },
  },
};
