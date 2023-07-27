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
import { Box, Stack } from '@mui/material';
import { red, orange, yellow, green, blue, indigo, purple } from '@mui/material/colors';
import { useState } from 'react';
import { StorySection } from '@perses-dev/storybook';
import { legendModes } from '@perses-dev/core';

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
      data: {
        index: i,
        squared: Math.pow(i, 2),
        cubed: Math.pow(i, 3),
        description: `This is entry #${i}`,
      },
    });
  }
  return data;
}

// Wrapper that manages the controlled legend selection state, so the individual
// story does not need to. Useful for stories that are not focused on explaining
// how this state works.
const UncontrolledLegendWrapper = (props: LegendProps) => {
  const [selectedItems, setSelectedItems] = useState<LegendProps['selectedItems']>(props.selectedItems);
  const [sorting, setSorting] = useState<NonNullable<LegendProps['tableProps']>['sorting']>();

  const handleSelectedItemsChange: LegendProps['onSelectedItemsChange'] = (newSelectedItems) => {
    action('onSelectedItemsChange')(newSelectedItems);
    setSelectedItems(newSelectedItems);
  };

  const handleSortingChange: NonNullable<LegendProps['tableProps']>['onSortingChange'] = (newSorting) => {
    action('onSortingChange')(newSorting);
    setSorting(newSorting);
  };

  return (
    <LegendWrapper
      {...props}
      selectedItems={selectedItems}
      onSelectedItemsChange={handleSelectedItemsChange}
      tableProps={{
        ...props.tableProps,
        sorting,
        onSortingChange: handleSortingChange,
      }}
    />
  );
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

        // Accounting for border sizes to fit nicely within the box without
        // changing the box-sizing.
        width: (position === 'Right' ? props.width + 100 : props.width) + borderWidth * 2,
        height: (position === 'Right' ? props.height : props.height + 100) + borderWidth * 2,
      }}
    >
      <Legend {...props} />
    </Box>
  );
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
      mode: 'List',
    },
    selectedItems: 'ALL',
  },
  render: (args) => {
    return <UncontrolledLegendWrapper {...args} />;
  },
};

export default meta;

type Story = StoryObj<typeof Legend>;

/**
 * Set `options.position` to `Right` or `Bottom` to posiition the legend.
 */
export const Position: Story = {
  args: {
    selectedItems: 'ALL',
  },
  argTypes: {
    // Do not show values managed internally in the render prop.
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
    data: {
      options: {
        disable: true,
      },
    },
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        <StorySection title="Right" level="h3">
          <LegendWrapper {...args} width={400} height={200} options={{ position: 'Right' }} />
        </StorySection>
        <StorySection title="Bottom" level="h3">
          <LegendWrapper {...args} width={500} height={100} options={{ position: 'Bottom' }} />
        </StorySection>
      </Stack>
    );
  },
};

/**
 * Set `options.mode` to `List` or `Table` to determine how the legend is
 * formatted.
 */
export const Mode: Story = {
  args: {
    selectedItems: 'ALL',
  },
  argTypes: {
    // Do not show values managed internally in the render prop.
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
    data: {
      options: {
        disable: true,
      },
    },
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendModes.map((mode) => {
          return (
            <StorySection key={mode} title={mode} level="h3">
              <LegendWrapper {...args} width={400} height={200} options={{ position: 'Right', mode }} />
            </StorySection>
          );
        })}
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
        <StorySection
          title="ALL: all items are selected, but they are not visually highlighted in list mode"
          level="h3"
        >
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    width={400}
                    height={200}
                    options={{ position: 'Right', mode }}
                    selectedItems="ALL"
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
        <StorySection title="partial selection: specified items are selected and visually highlighted" level="h3">
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    width={400}
                    height={200}
                    options={{ position: 'Right', mode }}
                    selectedItems={{
                      '1': true,
                      '3': true,
                    }}
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
      </Stack>
    );
  },
};

/**
 * When the legend mode is set to `table`, you may define additional columns
 * to display in the table after the selection checkboxes and the item label
 * using the `tableProps.columns` property.
 *
 * A `LegendItem` may define additional information for columns in the `data`
 * property and then use the `accessorKey` property of a column definition to
 * reference it.
 *
 * See the stories for the `Table` component for additional examples related to
 * defining table columns.
 */
export const TableColumns: Story = {
  args: {
    width: 500,
    height: 200,
    selectedItems: 'ALL',
    data: generateMockLegendData(10),
    options: { position: 'Bottom', mode: 'Table' },
    tableProps: {
      columns: [
        {
          header: 'Index',
          accessorKey: 'data.index',
          align: 'center',
          width: 70,
          enableSorting: true,
        },
        {
          header: 'Squared',
          accessorKey: 'data.squared',
          align: 'right',
          width: 80,
          enableSorting: true,
        },
        {
          header: 'Cubed',
          accessorKey: 'data.cubed',
          align: 'right',
          enableSorting: true,
          width: 80,
        },
        {
          header: 'Description',
          accessorKey: 'data.description',
        },
      ],
    },
  },
  argTypes: {
    // Do not show values managed internally in the render prop.
    data: {
      table: {
        disable: true,
      },
    },
  },
};

/**
 * The legend includes the following callback props for items in the legend:
 * - `onItemMouseOver`: mouse over the legend item.
 * - `onItemMouseOut`: mouse out the legend item.
 *
 * Each callback includes the following arguments:
 * - `e`: the event that triggered the callback.
 * - `opts`: an object containing the `index` and `id` for the legend item.
 */
export const LegendItemEvents: Story = {
  args: {
    selectedItems: 'ALL',
  },
  argTypes: {
    // Do not show values managed internally in the render prop.
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
    data: {
      options: {
        disable: true,
      },
    },
  },
  parameters: {
    // This story is functionally identical to several other ones and mostly
    // exists as a place to hang documentation, so we don't need another
    // screenshot for it.
    happo: false,
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendModes.map((mode) => {
          return (
            <StorySection key={mode} title={mode} level="h3">
              <LegendWrapper {...args} width={400} height={200} options={{ position: 'Right', mode }} />
            </StorySection>
          );
        })}
      </Stack>
    );
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
        <StorySection title="Small number of items" level="h3">
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    options={{ position: 'Right', mode }}
                    data={generateMockLegendData(4, labelPrefix)}
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
        <StorySection title=" Large number of items" level="h3">
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    options={{ position: 'Right', mode }}
                    data={generateMockLegendData(1000, labelPrefix)}
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
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
        <StorySection title="Position: right" level="h3">
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    width={400}
                    height={200}
                    options={{ position: 'Right', mode }}
                    data={generateMockLegendData(args.legendItemsCount)}
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
        <StorySection title="Position: bottom" level="h3">
          <Stack spacing={1} direction="row" flexWrap="wrap">
            {legendModes.map((mode) => {
              return (
                <StorySection key={mode} title={mode} level="h4">
                  <UncontrolledLegendWrapper
                    {...args}
                    width={500}
                    height={100}
                    options={{ position: 'Bottom', mode }}
                    data={generateMockLegendData(args.legendItemsCount)}
                  />
                </StorySection>
              );
            })}
          </Stack>
        </StorySection>
      </Stack>
    );
  },
};
