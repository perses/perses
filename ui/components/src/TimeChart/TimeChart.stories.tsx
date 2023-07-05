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
import { ChartHandle, TimeChart } from '@perses-dev/components';
import { waitForStableCanvas } from '@perses-dev/storybook';
import { Button, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof TimeChart> = {
  component: TimeChart,
  args: {
    height: 200,
    data: [
      {
        id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        values: [
          [1673784000000, 1],
          [1673784060000, 2],
          [1673784120000, null],
          [1673784240000, null],
          [1673784360000, 2],
          [1673784480000, 3],
        ],
      },
    ],
    seriesMapping: [
      {
        type: 'line',
        id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        datasetIndex: 0,
        name: 'test',
        connectNulls: false,
        color: 'hsla(158782136,50%,50%,0.8)',
        sampling: 'lttb',
        progressiveThreshold: 1000,
        symbolSize: 4,
        lineStyle: {
          width: 1.5,
          opacity: 0.8,
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 2.5,
            opacity: 1,
          },
        },
      },
    ],
    timeScale: {
      startMs: 1673784000000,
      endMs: 1673784480000,
      stepMs: 1,
      rangeMs: 480000,
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

type Story = StoryObj<typeof TimeChart>;

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
    const lineChartRef = useRef<ChartHandle>(null);

    const handleOnClickHighlightSeries = () => {
      const highlightSeriesId = args.data[0]?.id;
      if (!highlightSeriesId || !lineChartRef.current) {
        return;
      }

      const highlightSeriesOpts = {
        id: `${highlightSeriesId}`,
      };

      action('highlightSeries')(highlightSeriesOpts);
      lineChartRef.current.highlightSeries(highlightSeriesOpts);
    };

    const handleOnClickClearHighlightedSeries = () => {
      if (!lineChartRef.current) {
        return;
      }

      action('clearHighlightedSeries')();
      lineChartRef.current.clearHighlightedSeries();
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
        <TimeChart {...args} ref={lineChartRef} />
      </Stack>
    );
  },
};

export const NoData: Story = {
  args: {
    data: [],
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
          <TimeChart {...args} noDataVariant="message" />
        </div>
        <div>
          <Typography variant="h3" gutterBottom align="center">
            chart
          </Typography>
          <TimeChart {...args} noDataVariant="chart" />
        </div>
      </Stack>
    );
  },
};
