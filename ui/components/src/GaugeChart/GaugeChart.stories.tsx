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
import { GaugeChart } from '@perses-dev/components';
import { waitForStableCanvas } from '@perses-dev/storybook';

const meta: Meta<typeof GaugeChart> = {
  component: GaugeChart,
  parameters: {
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof GaugeChart>;

export const Primary: Story = {
  args: {
    height: 200,
    width: 400,
    data: { value: 63.87333983413257, label: '{env="demo",instance="demo.do.prometheus.io:9100",job="node"}' },
    unit: {
      decimal_places: 1,
      kind: 'Percent',
    },
    max: 100,
    axisLine: {
      show: true,
      lineStyle: {
        width: 5,
        color: [
          [0.008, 'rgba(47, 191, 114, 1)'],
          [0.009, 'rgba(255, 159, 28, 0.9)'],
          [1, 'rgba(234, 71, 71, 1)'],
        ],
      },
    },
  },
};

export const NullValue: Story = {
  args: {
    height: 200,
    width: 400,
    data: { value: null, label: '{env="demo",instance="demo.do.prometheus.io:9100",job="node"}' },
    unit: {
      decimal_places: 1,
      kind: 'Percent',
    },
    max: 100,
    axisLine: {
      show: true,
      lineStyle: {
        width: 5,
        color: [
          [0.008, 'rgba(47, 191, 114, 1)'],
          [0.009, 'rgba(255, 159, 28, 0.9)'],
          [1, 'rgba(234, 71, 71, 1)'],
        ],
      },
    },
  },
};
