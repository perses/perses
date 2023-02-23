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

import React from 'react';

import { StoryFn, Meta } from '@storybook/react';
import { LineChart } from '@perses-dev/components';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'LineChart',
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
} as Meta<typeof LineChart>;

// More on component templates: https://storybook.js.org/docs/react/writing-stories/introduction#using-args
const Template: StoryFn<typeof LineChart> = (args) => {
  return <LineChart {...args} />;
};

export const Primary = Template.bind({});
