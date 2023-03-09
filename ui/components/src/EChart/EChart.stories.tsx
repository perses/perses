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
import { EChart } from '@perses-dev/components';
import { use } from 'echarts/core';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';
import {
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { action } from '@storybook/addon-actions';

use([
  EChartsLineChart,
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
  SVGRenderer,
]);

const meta: Meta<typeof EChart> = {
  component: EChart,
  argTypes: {
    onEvents: {
      // It doesn't make sense for this to have an editable control because
      // we handle it with an action.
      control: false,
    },
    renderer: {
      control: {
        type: 'inline-radio',
      },
      options: ['canvas', 'svg'],
    },
  },
  args: {
    onEvents: {
      // This is not a comprehensive list. Just starting with a few examples.
      click: action('click'),
      mouseover: action('mouseover'),
      mouseout: action('mouseout'),
    },
  },
};

export default meta;

type Story = StoryObj<typeof EChart>;

export const Primary: Story = {
  args: {
    sx: {
      width: '600px',
      height: '300px',
    },
    option: {
      series: [
        {
          type: 'line',
          name: 'up{instance="demo.do.prometheus.io:3000",job="grafana"}',
          data: [1, 1, 1],
          color: 'hsla(158782136,50%,50%,0.8)',
          sampling: 'lttb',
          progressiveThreshold: 1000,
          symbolSize: 4,
          lineStyle: { width: 1.5 },
          emphasis: { lineStyle: { width: 2.5 } },
        },
      ],
      xAxis: { type: 'category', data: [1673784000000, 1673784060000, 1673784120000], axisLabel: {} },
      yAxis: [{ type: 'value', boundaryGap: [0, '10%'], axisLabel: {}, show: true }],
      animation: false,
      tooltip: { show: true, trigger: 'axis', showContent: false, axisPointer: { type: 'line', z: 0 } },
      toolbox: { feature: { dataZoom: { icon: null, yAxisIndex: 'none' } } },
      grid: { left: 20, right: 20, bottom: 0 },
    },
    renderer: 'canvas',
  },
};
