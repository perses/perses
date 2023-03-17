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
import { Legend, LegendProps } from '@perses-dev/components';
import { action } from '@storybook/addon-actions';
import { Box } from '@mui/material';
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

function generateMockLegendData(count: number): LegendProps['data'] {
  const data: LegendProps['data'] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `${i}`,
      label: `legend item ${i}`,
      isSelected: false,
      color: MOCK_COLORS[i % MOCK_COLORS.length] as string,
      onClick: action(`onClick legendItem ${i}`),
    });
  }
  return data;
}

// Simple wrapper to try to help visualize that the legend is positioned absolutely
// inside a relative ancestor.
const LegendWrapper = (props: LegendProps) => {
  return (
    <Box
      sx={{
        position: 'relative',
        width: props.width + 100,
        height: props.height + 100,
        border: (theme) => `solid 1px ${theme.palette.divider}`,
      }}
    >
      <Legend {...props} />
    </Box>
  );
};

const meta: Meta<typeof Legend> = {
  component: Legend,
  argTypes: {},
  args: {
    width: 400,
    height: 100,
    data: generateMockLegendData(5),
    options: {
      position: 'Bottom',
    },
  },
  render: (args) => {
    return <LegendWrapper {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof Legend>;

export const Bottom: Story = {
  args: {
    options: {
      position: 'Bottom',
    },
  },
};

export const Right: Story = {
  args: {
    width: 100,
    height: 200,
    options: {
      position: 'Right',
    },
  },
};

/**
 * The legend currently is not virtualized, so it can have performance issues
 * with larger amounts of data.
 */
export const Scalability: StoryObj<LegendProps & { legendItemsCount: number }> = {
  argTypes: {
    data: {
      control: false,
    },
  },
  args: {
    // Custom arg for just this story to easily control how many items are rendered
    // to test performance.
    legendItemsCount: 100,
  },
  parameters: {
    happo: false,
  },
  render: (args) => {
    return <LegendWrapper {...args} data={generateMockLegendData(args.legendItemsCount)} />;
  },
};
