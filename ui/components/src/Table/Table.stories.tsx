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
import { Table, TableProps } from '@perses-dev/components';
import { Stack, Typography } from '@mui/material';

type MockTableData = {
  label: string;
  value: number;
  color: string;
};

const COLUMNS: TableProps<MockTableData>['columns'] = [
  {
    accessorKey: 'label',
    header: 'Label',
    cell: ({ getValue }) => <span title={getValue()}>{getValue()}</span>,
  },
  {
    accessorKey: 'value',
    header: 'Value',
    size: 100,
  },
  {
    accessorKey: 'color',
    header: 'Color',
    size: 100,
  },
];

const meta: Meta<typeof Table> = {
  component: Table,
  args: {
    density: 'standard',
  },
  argTypes: {
    data: {
      // Hide table for data because we are going to set it to mock data in
      // our stories and large data takes up a lot of space in the args table.
      table: {
        disable: true,
      },
    },
    density: {
      control: 'radio',
      options: ['compact', 'standard'],
    },
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<typeof Table<MockTableData>>;

import { red, orange, yellow, green, blue, indigo, purple } from '@mui/material/colors';

const COLOR_SHADES = ['400', '800'] as const;
const COLOR_NAMES = [red, orange, yellow, green, blue, indigo, purple];
const MOCK_COLORS = COLOR_SHADES.reduce((results, colorShade) => {
  COLOR_NAMES.map((colorName) => {
    if (colorShade in colorName) {
      results.push(colorName[colorShade]);
    }
  });
  return results;
}, [] as string[]);

function generateMockTableData(count: number): MockTableData[] {
  const data: MockTableData[] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      label: `my column has a label ${i} that may be ellipsized when it does not fit within the column`,
      value: i,
      color: MOCK_COLORS[i % MOCK_COLORS.length] as string,
    });
  }
  return data;
}

export const Primary: Story = {
  args: {
    height: 400,
    width: 600,
    data: generateMockTableData(1000),
    columns: COLUMNS,
  },
};

export const Density: Story = {
  args: {
    height: 300,
    width: 400,
    data: generateMockTableData(100),
    columns: COLUMNS,
  },
  argTypes: {
    data: {
      // Hide configuration because we are setting these values in this story.
      density: {
        disable: true,
      },
    },
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            standard
          </Typography>
          <Table {...args} density="standard" />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            compact
          </Typography>
          <Table {...args} density="compact" />
        </div>
      </Stack>
    );
  },
};

export const CheckboxSelection: Story = {
  args: {
    height: 400,
    width: 600,
    data: generateMockTableData(500),
    columns: COLUMNS,
    checkboxSelection: true,
    getCheckboxColor: (data) => data.color,
  },
};
