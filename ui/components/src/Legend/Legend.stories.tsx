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
import { Box, Stack, Typography } from '@mui/material';
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

function generateMockLegendData(count: number, labelPrefix = 'legend item'): LegendProps['data'] {
  const data: LegendProps['data'] = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: `${i}`,
      label: `${labelPrefix} ${i}`,
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
  const {
    options: { position },
  } = props;

  return (
    <Box
      sx={{
        border: (theme) => `solid 1px ${theme.palette.divider}`,
        position: 'relative',
        width: position === 'Right' ? props.width + 100 : props.width,
        height: position === 'Right' ? props.height : props.height + 100,

        // This is a rare case where content-box is helpful because we want to
        // have the border be additive, so we don't have to do any special
        // math with the height/width or end up with an off-by-2px issue.
        boxSizing: 'content-box',
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
    width: 200,
    height: 300,
    options: {
      position: 'Right',
    },
  },
};

/**
 * When the legend is positioned on the right, items with long labels will be
 * displayed in full when there are a small number of items.
 *
 * When there are a larger number of items, longer labels will be truncated to
 * fit within the width. On hover, the full label will be displayed.
 */
export const RightWithLongLabels: Story = {
  args: {
    width: 200,
    height: 300,
  },
  argTypes: {
    data: {
      table: {
        disable: true,
      },
    },
    options: {
      table: {
        disable: true,
      },
    },
  },
  render: (args) => {
    const labelPrefix = 'long_legend_label{env="demo", namespace="prometheus"}';

    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            Small number of items
          </Typography>
          <LegendWrapper {...args} options={{ position: 'Right' }} data={generateMockLegendData(4, labelPrefix)} />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            Large number of items
          </Typography>
          <LegendWrapper {...args} options={{ position: 'Right' }} data={generateMockLegendData(1000, labelPrefix)} />
        </div>
      </Stack>
    );

    return <LegendWrapper {...args} data={generateMockLegendData(3)} />;
  },
};

/**
 * The legend uses virtualization to avoid performance issues when there are a
 * large number of items to display.
 *
 * When the legend is positioned on the right, it is always rendered in a
 * virtualized list with a single item per row.
 *
 * When the legend is positioned on the bottom with a small number of items,
 * it is rendered in a compact, non-virtualized inline list with a variable number
 * of items per row. When the number of items is large enough to cause performance,
 * issues, it is rendered in a virtualized list with a single item per row.
 */
export const Scalability: StoryObj<LegendProps & { legendItemsCount: number }> = {
  argTypes: {
    data: {
      table: {
        disable: true,
      },
    },
    width: {
      table: {
        disable: true,
      },
    },
    height: {
      table: {
        disable: true,
      },
    },
    options: {
      table: {
        disable: true,
      },
    },
  },
  args: {
    // Custom arg for just this story to easily control how many items are rendered
    // to test performance.
    legendItemsCount: 1000,
  },
  parameters: {
    happo: false,
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            Position: right
          </Typography>
          <LegendWrapper
            {...args}
            width={400}
            height={200}
            options={{ position: 'Right' }}
            data={generateMockLegendData(args.legendItemsCount)}
          />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            Position: bottom
          </Typography>
          <LegendWrapper
            {...args}
            width={500}
            height={100}
            options={{ position: 'Bottom' }}
            data={generateMockLegendData(args.legendItemsCount)}
          />
        </div>
      </Stack>
    );
  },
};
