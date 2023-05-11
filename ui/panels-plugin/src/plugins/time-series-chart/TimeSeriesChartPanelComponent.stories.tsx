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
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import {
  WithDataQueries,
  WithPluginRegistry,
  WithTimeRange,
  WithTemplateVariables,
  WithDatasourceStore,
} from '@perses-dev/plugin-system/src/stories/shared-utils';
import { mockTimeSeriesResponseWithStableValue } from '@perses-dev/internal-utils';
import { mockQueryRangeRequests, waitForStableCanvas, WithQueryClient, WithQueryParams } from '@perses-dev/storybook';
import { ComponentProps } from 'react';

type TimeSeriesChartProps = ComponentProps<typeof TimeSeriesChart.PanelComponent>;

type TimeSeriesChartWrapperProps = TimeSeriesChartProps & {
  height?: number;
  width?: number;
};
function TimeSeriesChartWrapper({ height, width, ...otherProps }: TimeSeriesChartWrapperProps) {
  return (
    <div style={{ width: width, height: height }}>
      <TimeSeriesChart.PanelComponent {...otherProps} />
    </div>
  );
}

// Mock time range values used for mocking the time range in the system and
// mock data responses to ensure consistent results when viewing and taking
// visual testing snapshots of stories.
// Currenting has a 6 hour time range.
const TIMESERIES_EXAMPLE_MOCK_END = 1673805600000;
const TIMESERIES_EXAMPLE_MOCK_START = TIMESERIES_EXAMPLE_MOCK_END - 6 * 60 * 60 * 1000;

/**
 * The panel component for the `TimeSeriesChart` panel plugin.
 *
 * This component is not intended to be used directly. It is documented in storybook
 * to provide an example of what the plugin panel component looks like.
 */
const meta: Meta<typeof TimeSeriesChart.PanelComponent> = {
  component: TimeSeriesChart.PanelComponent,
  argTypes: {},
  parameters: {
    WithDataQueries: {
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
          start: TIMESERIES_EXAMPLE_MOCK_START,
          end: TIMESERIES_EXAMPLE_MOCK_END,
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
                body: mockTimeSeriesResponseWithStableValue({
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
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalDatapoints: 10000,
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
    WithTemplateVariables,
    WithDatasourceStore,
    WithPluginRegistry,
    WithTimeRange,
    WithQueryClient,
    WithQueryParams,
  ],
  render: (args) => {
    return (
      <TimeSeriesChartWrapper width={args.contentDimensions?.width} height={args.contentDimensions?.height} {...args} />
    );
  },
};

export default meta;

type Story = StoryObj<typeof TimeSeriesChart.PanelComponent>;

export const Primary: Story = {
  args: {
    contentDimensions: {
      width: 600,
      height: 400,
    },
    spec: {
      legend: {
        position: 'Bottom',
      },
    },
  },
};
