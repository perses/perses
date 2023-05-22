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
import { useState } from 'react';

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
      color: MOCK_COLORS[i % MOCK_COLORS.length] as string,
      onClick: action(`onClick legendItem ${i}`),
    });
  }
  return data;
}

// Wrapper that manages the controlled legend selection state, so the individual
// story does not need to. Useful for stories that are not focused on explaining
// how this state works.
const UncontrolledLegendWrapper = (props: LegendProps) => {
  const [selectedItems, setSelectedItems] = useState<LegendProps['selectedItems']>('ALL');
  const handleSelectedItemsChange: LegendProps['onSelectedItemsChange'] = (newSelectedItems) => {
    action('onSelectedItemsChange')(newSelectedItems);
    setSelectedItems(newSelectedItems);
  };

  return <LegendWrapper {...props} selectedItems={selectedItems} onSelectedItemsChange={handleSelectedItemsChange} />;
};

// Simple wrapper to try to help visualize that the legend is positioned absolutely
// inside a relative ancestor.
const LegendWrapper = (props: LegendProps) => {
  const {
    options: { position },
  } = props;

  const borderWidth = 1;

  // The legend does not look very interesting by itself in stories, especially
  // when considering the positioning. This wrapper puts a box with a border
  // and some additional height/width (depending on the positioning of the
  // legend) to make it easier to see how the legend would look in context
  // alongside other content.
  return (
    <Box
      sx={{
        border: (theme) => `solid ${borderWidth}px ${theme.palette.divider}`,
        position: 'relative',
        width: (position === 'Right' ? props.width + 100 : props.width) + borderWidth * 2,
        height: (position === 'Right' ? props.height : props.height + 100) + borderWidth * 2,
      }}
    >
      <Legend {...props} />
    </Box>
  );
};

// Wrapper that manages selected state for table legends.
const TableLegendWrapper = (props: LegendProps) => {
  const [rowSelection, setRowSelection] = useState<LegendProps['selectedItems']>('ALL');

  const handleRowSelectionChange: LegendProps['onSelectedItemsChange'] = (newRowSelection) => {
    action('onRowSelectionChange')(newRowSelection);
    setRowSelection(newRowSelection);
  };

  return <LegendWrapper {...props} selectedItems={rowSelection} onSelectedItemsChange={handleRowSelectionChange} />;
};

const meta: Meta<typeof Legend> = {
  component: Legend,
  argTypes: {
    // Disabling the controls for these types because they are managed inside
    // LegendWrapper for the purpose of stories.
    selectedItems: {
      control: false,
    },
    onSelectedItemsChange: {
      control: false,
    },
  },
  args: {
    width: 400,
    height: 100,
    data: generateMockLegendData(5),
    options: {
      position: 'Bottom',
    },
  },
  render: (args) => {
    return <UncontrolledLegendWrapper {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof Legend>;

export const Table: Story = {
  args: {
    data: generateMockLegendData(100),
  },
  argTypes: {
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
  render: (args) => {
    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            Right
          </Typography>
          <TableLegendWrapper {...args} options={{ mode: 'Table', position: 'Right' }} width={400} height={200} />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            Bottom
          </Typography>
          <TableLegendWrapper {...args} options={{ mode: 'Table', position: 'Bottom' }} width={500} height={100} />
        </div>
      </Stack>
    );
  },
};

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
          <UncontrolledLegendWrapper
            {...args}
            options={{ position: 'Right' }}
            data={generateMockLegendData(4, labelPrefix)}
          />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            Large number of items
          </Typography>
          <UncontrolledLegendWrapper
            {...args}
            options={{ position: 'Right' }}
            data={generateMockLegendData(1000, labelPrefix)}
          />
        </div>
      </Stack>
    );
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
          <UncontrolledLegendWrapper
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
          <UncontrolledLegendWrapper
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

/**
 * The selection and visual highlighting of items within the legend is controlled
 * using the `selectedItems` and `onSelectedItemsChange` props.
 *
 * The selection behavior is as followed based on the setting of `selectedItems:
 * - When "ALL", all legend items are selected, but not visually highlighted.
 * - Otherwise, it is a Record that associates legend item ids with a boolean
 *   value. When the associated entry for a legend item is `true`, that item
 *   will be treated as selected and visually highlighted.
 */
export const SelectedItems: StoryObj<LegendProps> = {
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
    selectedItems: {
      table: {
        disable: true,
      },
    },
    onSelectedItemsChange: {
      table: {
        disable: true,
      },
    },
  },
  args: {},
  render: (args) => {
    return (
      <Stack spacing={3}>
        <div>
          <Typography variant="h3" gutterBottom>
            ALL: all items are selected, but they are not visually highlighted
          </Typography>
          <LegendWrapper {...args} width={400} height={200} options={{ position: 'Right' }} selectedItems="ALL" />
        </div>
        <div>
          <Typography variant="h3" gutterBottom>
            partial selection: specified items are selected and visually highlighted
          </Typography>
          <LegendWrapper
            {...args}
            width={400}
            height={200}
            options={{ position: 'Right' }}
            selectedItems={{
              '1': true,
              '3': true,
            }}
          />
        </div>
      </Stack>
    );
  },
};
