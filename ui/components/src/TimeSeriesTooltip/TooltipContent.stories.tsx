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
import { TooltipContent } from '@perses-dev/components';
// import { Button } from '@mui/material';

const meta: Meta<typeof TooltipContent> = {
  component: TooltipContent,
  argTypes: {
    // placement: {
    //   options: ['top', 'left', 'right', 'bottom'],
    //   control: 'select',
    // },
    // children: {
    //   control: false,
    // },
  },
  parameters: {
    happo: false,
  },
};

export default meta;

type Story = StoryObj<typeof TooltipContent>;

export const Primary: Story = {};

export const SingleSeries: Story = {
  args: {
    series: [
      {
        seriesIdx: 0,
        datumIdx: 84,
        seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        // seriesName: 'Test node demo.do.prometheus.io:9100',
        date: 1671803580000,
        x: 1671821580000,
        y: 0.1,
        formattedY: '0.1',
        markerColor: 'hsla(19838016,50%,50%,0.8)',
        isClosestToCursor: false,
      },
    ],
    wrapLabels: true,
    // data: {
    //   // timeSeries: [],
    //   // xAxis: [1673784000000, 1673784060000, 1673784120000],
    //   // legendItems: [],
    //   // rangeMs: 21600000,
    // },
  },
  render: (args) => {
    return (
      <div style={{ width: '100px' }}>
        <TooltipContent {...args} />
      </div>
    );
  },
};

export const MultiSeries: Story = {
  args: {
    series: [
      {
        seriesIdx: 2,
        datumIdx: 48,
        seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        date: 1671803040000,
        x: 1671821040000,
        y: 84635648,
        formattedY: '84.64M',
        markerColor: 'hsla(1887856572,50%,50%,0.8)',
        isClosestToCursor: false,
      },
      {
        seriesIdx: 1,
        datumIdx: 48,
        seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
        date: 1671803040000,
        x: 1671821040000,
        y: 33771520,
        formattedY: '33.77M',
        markerColor: 'hsla(158479636,50%,50%,0.8)',
        isClosestToCursor: false,
      },
    ],
    wrapLabels: true,
  },
  render: (args) => {
    return (
      <div style={{ width: '100px' }}>
        <TooltipContent {...args} />
      </div>
    );
  },
};
