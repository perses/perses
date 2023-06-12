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
import { LineChart, formatValue } from '@perses-dev/components';
import { waitForStableCanvas } from '@perses-dev/storybook';
import { Box, Stack, Typography } from '@mui/material';
import { YAXisComponentOption } from 'echarts';
import { tooltipPluginData, TOOLTIP_PLUGIN_CHART_HEIGHT } from '../test-utils/tooltip-plugin-data';

const meta: Meta<typeof LineChart> = {
  component: LineChart,
  args: {
    height: 200,
    data: {
      timeSeries: [
        {
          type: 'line' as const,
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

function ExampleTooltipPlugin() {
  return (
    <Box p={2}>
      <Typography>Tooltip Plugin Content Override</Typography>
    </Box>
  );
}

const annotationsPopulated = true;
const eventsBoundaryOffset = annotationsPopulated ? '50%' : '10%';

const yAxisArr = [
  {
    type: 'value',
    boundaryGap: [0, eventsBoundaryOffset],
    axisLabel: {
      showMaxLabel: !annotationsPopulated,
      formatter: (value: number) => {
        return formatValue(value, { kind: 'Decimal' });
      },
    },
  },
  {
    show: true,
    type: 'value',
    data: tooltipPluginData.timeSeries.filter((series) => series.type === 'line').map((_, idx) => idx),
    axisTick: { show: false },
    axisLabel: { show: true },
    axisLine: { show: false },
  },
] as YAXisComponentOption[];

export const TooltipContentPlugin: Story = {
  args: {
    tooltipConfig: {
      wrapLabels: true,
      plugin: {
        seriesTypeTrigger: 'scatter',
        tooltipOverride: <ExampleTooltipPlugin />,
      },
    },
    data: tooltipPluginData,
    grid: {
      top: 30,
      right: 20,
      bottom: 10,
      left: 20,
    },
    height: TOOLTIP_PLUGIN_CHART_HEIGHT,
    xAxis: [
      {
        show: true,
        type: 'category',
        data: [
          1685966835000, 1685966850000, 1685966865000, 1685966880000, 1685966895000, 1685966910000, 1685966925000,
          1685966940000,
        ],
        splitLine: {
          show: false,
        },
      },
      {
        show: true,
        type: 'category',
        position: 'top',
        data: [1685966835000, 1685966856000, 1685966877000, 1685966898000, 1685966919000],
        axisLine: {
          show: false,
          lineStyle: {
            opacity: 0,
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          show: false,
        },
        axisPointer: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    yAxis: yAxisArr,
  },
  render: (args) => {
    return (
      <Stack>
        <div>
          <Typography variant="h3" gutterBottom>
            Tooltip Content Plugin
          </Typography>
          <LineChart {...args} noDataVariant="message" />
        </div>
      </Stack>
    );
  },
};
