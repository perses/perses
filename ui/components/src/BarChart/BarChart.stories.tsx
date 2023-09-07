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
import { BarChart, BarChartData } from '@perses-dev/components';
import { waitForStableCanvas } from '@perses-dev/storybook';

const DEFAULT_DATA: BarChartData[] = [
  {
    label: 'pool_sb1 Quota',
    value: 2256,
  },
  {
    label: 'pool_sb2 Quota',
    value: 4938,
  },
  {
    label: 'pool_sb3 Quota',
    value: 2625,
  },
  {
    label: 'pool_sb4 Quota',
    value: 6314,
  },
  {
    label: 'pool_sb5 Quota',
    value: 1200,
  },
  {
    label: 'pool_sb6 Quota',
    value: 1479,
  },
];

const meta: Meta<typeof BarChart> = {
  component: BarChart,
  parameters: {
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof BarChart>;

export const Primary: Story = {
  args: {
    width: 600,
    height: 300,
    data: DEFAULT_DATA,
    format: { unit: 'decimal', shortValues: false },
  },
};

export const NoData: Story = {
  args: {
    width: 600,
    height: 300,
    data: undefined,
    format: { unit: 'decimal', shortValues: false },
  },
};
