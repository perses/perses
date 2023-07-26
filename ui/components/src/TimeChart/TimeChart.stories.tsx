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
import { waitForStableCanvas } from '@perses-dev/storybook';
import { TimeSeries } from '@perses-dev/core';
import {
  ChartInstance,
  DEFAULT_TOOLTIP_CONFIG,
  TimeChart,
  ChartsProvider,
  testChartsTheme,
} from '@perses-dev/components';
import { Button, Stack, Typography } from '@mui/material';
import { useRef } from 'react';
import { action } from '@storybook/addon-actions';

const meta: Meta<typeof TimeChart> = {
  component: TimeChart,
  args: {
    height: 200,
    data: [
      {
        name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        values: [
          [1673784000000, 1],
          [1673784060000, 2],
          [1673784120000, null],
          [1673784180000, null],
          [1673784240000, 4],
          [1673784300000, 1],
          [1673784360000, 2],
          [1673784420000, 3],
        ],
      },
      {
        name: 'up{instance="demo.do.prometheus.io:3000",job="caddy"}',
        values: [
          [1673784000000, 8],
          [1673784060000, 6],
          [1673784120000, 10],
          [1673784180000, 9],
          [1673784240000, 7],
          [1673784300000, 8],
          [1673784360000, 12],
          [1673784420000, 10],
        ],
      },
    ],
    seriesMapping: [
      {
        type: 'line',
        id: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
        datasetIndex: 0,
        name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
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
      {
        type: 'line',
        id: 'up{instance="demo.do.prometheus.io:3000",job="caddy"}',
        datasetIndex: 1,
        name: 'up{instance="demo.do.prometheus.io:3000",job="caddy"}',
        connectNulls: false,
        color: 'hsla(240,50%,50%,0.8)',
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
    yAxis: {
      show: true,
    },
    unit: {
      kind: 'Decimal' as const,
      decimal_places: 2,
      abbreviate: true,
    },
    tooltipConfig: DEFAULT_TOOLTIP_CONFIG,
    grid: {
      left: 20,
      right: 20,
      bottom: 0,
    },
  },
  parameters: {
    happo: false,
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
    const chartRef = useRef<ChartInstance>(null);

    const handleOnClickHighlightSeries = () => {
      const highlightSeriesId = args.data[0]?.name;
      if (!highlightSeriesId || !chartRef.current) {
        return;
      }

      const highlightSeriesOpts = {
        name: `${highlightSeriesId}`,
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
        <TimeChart {...args} ref={chartRef} />
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
  parameters: {
    // TODO: look into why test is flaky
    happo: false,
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

// Time series bar test data to demonstrate visual.display and visual.stack
const STACKED_BAR_DATA: TimeSeries[] = [
  {
    name: '{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690076580000, 585465856],
      [1690076595000, 597020672],
      [1690076610000, 595795968],
      [1690076625000, 595472384],
      [1690076640000, 604037120],
      [1690076655000, 587571200],
      [1690076670000, 584241152],
      [1690076685000, 584945664],
    ],
  },
  {
    name: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690076580000, 41164800],
      [1690076595000, 41177088],
      [1690076610000, 41193472],
      [1690076625000, 41209856],
      [1690076640000, 41234432],
      [1690076655000, 41246720],
      [1690076670000, 41267200],
      [1690076685000, 41279488],
    ],
  },
  {
    name: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
    values: [
      [1690076580000, 106176512],
      [1690076595000, 94519296],
      [1690076610000, 95629312],
      [1690076625000, 95854592],
      [1690076640000, 87154688],
      [1690076655000, 103501824],
      [1690076670000, 106725376],
      [1690076685000, 105930752],
    ],
  },
];

export const StackedBar: Story = {
  parameters: {
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
  },
  args: {
    height: 200,
    isStackedBar: true,
    timeScale: { startMs: 1690076580000, endMs: 1690076685000, stepMs: 15000, rangeMs: 105000 },
    data: STACKED_BAR_DATA,
    seriesMapping: [
      {
        type: 'bar',
        id: 'time-series-panel-19{env="demo",instance="demo.do.prometheus.io:9100",job="node"}0',
        datasetIndex: 0,
        name: '{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        color: '#56B4E9',
        stack: 'all',
        label: {
          show: false,
        },
      },
      {
        type: 'bar',
        id: 'time-series-panel-19node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}1',
        datasetIndex: 1,
        name: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        color: '#009E73',
        stack: 'all',
        label: {
          show: false,
        },
      },
      {
        type: 'bar',
        id: 'time-series-panel-19node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}2',
        datasetIndex: 2,
        name: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        color: '#0072B2',
        stack: 'all',
        label: {
          show: false,
        },
      },
    ],
    yAxis: {
      show: true,
      min: 400000000,
    },
    unit: {
      kind: 'Decimal',
      abbreviate: true,
    },
    tooltipConfig: { wrapLabels: true, enablePinning: false },
    grid: {
      left: 20,
      right: 20,
      bottom: 0,
    },
  },
  render: (args) => {
    return <TimeChart {...args} />;
  },
};

export const PinnedTooltip: Story = {
  parameters: {
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
  },
  args: {
    tooltipConfig: { wrapLabels: true, enablePinning: true },
  },
  render: (args) => {
    return (
      <ChartsProvider chartsTheme={testChartsTheme} enablePinning={true}>
        <TimeChart {...args} />
      </ChartsProvider>
    );
  },
};
