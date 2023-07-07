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

import { StoryObj, Meta } from '@storybook/react';
import { LineChart, ChartInstance } from '@perses-dev/components';
import { waitForStableCanvas } from '@perses-dev/storybook';
import { Button, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof LineChart> = {
  component: LineChart,
  args: {
    height: 200,
    data: {
      timeSeries: [
        {
          type: 'line' as const,
          id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}_1',
          name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
          data: [1, 1, 1],
          color: 'hsla(158782136,50%,50%,0.8)',
          sampling: 'lttb' as const,
          progressiveThreshold: 1000,
          symbolSize: 4,
          lineStyle: { width: 1.5 },
          emphasis: { lineStyle: { width: 2.5 } },
        },
      ],
      xAxis: [1673784000000, 1673784060000, 1673784120000],
      legendItems: [],
      rangeMs: 21600000,
    },
    yAxis: {
      show: true,
    },
    unit: {
      kind: 'Decimal' as const,
      decimal_places: 2,
      abbreviate: true,
    },
    grid: {
      left: 20,
      right: 20,
      bottom: 0,
    },
  },
  parameters: {
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof LineChart>;

export const Primary: Story = {};

/**
 * Setting a `ref` on a `LineChart` exposes an API with the following methods:
 * - `highlightSeries`: Highlight the series associated with the specified options. The options currently takes an `id`.
 * - `clearHighlightedSeries`: Clear all highlighted series.
 */
export const RefApi: Story = {
  parameters: {
    // This story exists to show how the api works and is not valuable as a
    // visual test.
    happo: false,
  },
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const chartRef = useRef<ChartInstance>(null);

    const handleOnClickHighlightSeries = () => {
      const highlightSeriesId = args.data.timeSeries[0]?.id;
      if (!highlightSeriesId || !chartRef.current) {
        return;
      }

      const highlightSeriesOpts = {
        id: `${highlightSeriesId}`,
      };

      action('highlightSeries')(highlightSeriesOpts);
      chartRef.current.highlightSeries(highlightSeriesOpts);
    };

    const handleOnClickClearHighlightedSeries = () => {
      if (!chartRef.current) {
        return;
      }

      action('clearHighlightedSeries')();
      chartRef.current.clearHighlightedSeries();
    };

    return (
      <Stack spacing={3}>
        <Stack spacing={1} direction="row">
          <Button onClick={handleOnClickHighlightSeries} variant="outlined">
            highlightSeries
          </Button>
          <Button onClick={handleOnClickClearHighlightedSeries} variant="outlined">
            clearHighlightedSeries
          </Button>
        </Stack>
        <LineChart {...args} ref={chartRef} />
      </Stack>
    );
  },
};

export const NoData: Story = {
  args: {
    data: {
      timeSeries: [],
      xAxis: [1673784000000, 1673784060000, 1673784120000],
      legendItems: [],
      rangeMs: 21600000,
    },
  },
  argTypes: {
    // Remove from table because these values are managed in render.
    data: {
      table: {
        disable: true,
      },
    },
    noDataVariant: {
      table: {
        disable: true,
      },
    },
  },
  render: (args) => {
    return (
      <Stack>
        <div>
          <Typography variant="h3" gutterBottom align="center">
            message
          </Typography>
          <LineChart {...args} noDataVariant="message" />
        </div>
        <div>
          <Typography variant="h3" gutterBottom align="center">
            chart
          </Typography>
          <LineChart {...args} noDataVariant="chart" />
        </div>
      </Stack>
    );
  },
};
