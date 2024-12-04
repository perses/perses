// Copyright 2024 The Perses Authors
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
import { StatusHistoryChart, StatusHistoryChartProps, StatusHistoryDataItem } from './StatusHistoryChart';

const DEFAULT_DATA: StatusHistoryDataItem[] = [
  {
    value: [0, 0, 1],
    label: '1',
  },
  {
    value: [1, 0, 2],
    label: '2',
  },
  {
    value: [2, 0, 3],
    label: '3',
  },
  {
    value: [0, 1, 2],
    label: '2',
  },
  {
    value: [1, 1, 3],
    label: '3',
  },
  {
    value: [2, 1, 1],
    label: '1',
  },
];

const meta: Meta<typeof StatusHistoryChart> = {
  component: StatusHistoryChart,
  args: {
    height: 300,
    data: DEFAULT_DATA,
    xAxisCategories: [1677338340000, 1677338370000, 1677338400000],
    yAxisCategories: ['Category 1', 'Category 2'],
  },
  render: (args) => <StatusHistoryChartWrapper {...args} />,
};

export default meta;

type Story = StoryObj<typeof StatusHistoryChart>;

const StatusHistoryChartWrapper = (props: StatusHistoryChartProps): ReactElement => {
  // This wrapper is needed or the status history chart does not size as expected.
  return (
    <div
      style={{
        height: props.height,
        width: '100%',
      }}
    >
      <StatusHistoryChart {...props} />
    </div>
  );
};

export const Primary: Story = {
  args: {},
};

export const WithLegend: Story = {
  args: {
    legend: {
      show: true,
      data: ['Status 1', 'Status 2', 'Status 3'],
    },
  },
};
