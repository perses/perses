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
import { ContentWithLegend, LegendProps, LineChart } from '@perses-dev/components';
import { action } from '@storybook/addon-actions';
import { red, orange, yellow, green, blue, indigo, purple } from '@mui/material/colors';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { StorySection } from '@perses-dev/storybook';
import { useState } from 'react';
import { LegendPositions, legendModes, legendPositions, legendSizes } from '@perses-dev/core';

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

const meta: Meta<typeof ContentWithLegend> = {
  component: ContentWithLegend,
  argTypes: {},
  args: {
    children: ({ height }) => (
      <LineChart
        height={height}
        data={{
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
        }}
        yAxis={{
          show: true,
        }}
        format={{
          unit: 'decimal' as const,
          decimalPlaces: 2,
          shortValues: true,
        }}
      />
    ),
    width: 600,
    height: 300,
    spacing: 10,
    legendProps: {
      data: generateMockLegendData(10),
      options: {
        position: 'right',
        mode: 'list',
      },
      selectedItems: {},
      onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
    },
  },
  parameters: {},
};

export default meta;

type Story = StoryObj<typeof ContentWithLegend>;

export const Primary: Story = {
  args: {},
};

/**
 * The layout of the content alongside the legend is determined by
 * `legendProps.options.position`.
 */
export const Position: Story = {
  args: {},
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendPositions.map((position) => {
          return (
            <StorySection key={position} title={position} level="h3">
              <ContentWithLegend
                {...args}
                legendProps={{
                  data: generateMockLegendData(10),
                  options: {
                    position,
                    mode: 'list',
                  },
                  selectedItems: {},
                  onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
                }}
              />
            </StorySection>
          );
        })}
      </Stack>
    );
  },
};

/**
 * The amount of space the legend takes up is determined by the `legendSize`.
 */
export const LegendSize: Story = {
  args: {},
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendSizes.map((size) => {
          return (
            <StorySection key={size} title={size} level="h3">
              <Stack spacing={1} direction="row">
                {legendPositions.map((position) => {
                  return (
                    <StorySection key={position} title={position} level="h4">
                      <ContentWithLegend
                        {...args}
                        legendSize={size}
                        legendProps={{
                          data: generateMockLegendData(10),
                          options: {
                            position,
                            mode: 'table',
                          },
                          selectedItems: {},
                          onSelectedItemsChange: (newSelectedItems) =>
                            action('onSelectedItemsChange')(newSelectedItems),
                        }}
                      />
                    </StorySection>
                  );
                })}
              </Stack>
            </StorySection>
          );
        })}
      </Stack>
    );
  },
};

export const Mode: Story = {
  args: {
    width: 500,
    height: 300,
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendModes.map((mode) => {
          return (
            <StorySection key={mode} title={mode} level="h3">
              <Stack spacing={1} direction="row" flexWrap="wrap">
                {legendPositions.map((position) => {
                  return (
                    <StorySection key={position} title={position} level="h4">
                      <ContentWithLegend
                        {...args}
                        legendProps={{
                          data: generateMockLegendData(10),
                          options: {
                            position,
                            mode,
                          },
                          selectedItems: 'ALL',
                          onSelectedItemsChange: (newSelectedItems) =>
                            action('onSelectedItemsChange')(newSelectedItems),
                        }}
                      />
                    </StorySection>
                  );
                })}
              </Stack>
            </StorySection>
          );
        })}
      </Stack>
    );
  },
};

/**
 * Use the `children` prop to specify the content to be laid out alongside the
 * legend. This prop can be one of the following:
 * - React node
 * - Function that returns a React node. The function provides the expected
 *   height and width for the content, which can be useful for passing down
 *   to chart components.
 */
export const Children: Story = {
  args: {
    legendProps: {
      data: generateMockLegendData(10),
      options: {
        position: 'right',
        mode: 'list',
      },
      selectedItems: {},
      onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
    },
  },
  argTypes: {
    // Manage children inside the story, so do not make it customizable.
    children: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    // Not a meaningful story to get visual diffs from.
    happo: false,
  },
  render: (args) => {
    return (
      <Stack spacing={3}>
        <ContentWithLegend {...args}>
          {({ width, height }) => {
            return (
              <div
                style={{
                  background: 'lightgrey',
                  width,
                  height,
                  padding: '20px',
                  textAlign: 'center',
                }}
              >
                content from function
              </div>
            );
          }}
        </ContentWithLegend>
        <ContentWithLegend {...args}>
          <div
            style={{
              background: 'lightgrey',
              width: '100%',
              height: '100%',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            content from react node
          </div>
        </ContentWithLegend>
      </Stack>
    );
  },
};

/**
 * If `legendProps` is not specified, the `children` will fill the entire
 * content and no legend will be rendered.
 */
export const NoLegend: Story = {
  args: {
    legendProps: undefined,
  },
};

/**
 * When laying out a legend with `mode` set to `table`, `position` set to `right`,
 * and additional `tableProps.columns` defined, the width of the legend will be
 * increased to account for column definitions with the `width` set to a numeric
 * value.
 */
export const TableWithColumns: Story = {
  args: {
    legendProps: {
      data: generateMockLegendData(10),
      options: {
        position: 'right',
        mode: 'table',
      },
      selectedItems: {},
      onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
      tableProps: {
        columns: [
          {
            header: 'Index',
            accessorKey: 'data.index',
            align: 'center',
            width: 50,
          },
          {
            header: 'Squared',
            accessorKey: 'data.squared',
            align: 'right',
            width: 60,
          },
          {
            header: 'Cubed',
            accessorKey: 'data.cubed',
            align: 'right',
            width: 70,
          },
        ],
      },
    },
  },
};

/**
 * Use the `minChildrenHeight` and `minChildrenWidth` props to manage responsive
 * handling for bottom and right positioned legends. If the content specified
 * by `children` will be smaller than these values, the legend will not be
 * shown.
 */
export const Responsive: Story = {
  args: {},
  render: (args) => {
    return (
      <Stack spacing={3}>
        <StorySection title="legend is hidden when it will not fit" level="h3">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ContentWithLegend
              {...args}
              width={300}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'right',
                  mode: 'list',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
            <ContentWithLegend
              {...args}
              height={100}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'bottom',
                  mode: 'list',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
          </Stack>
        </StorySection>
        <StorySection title="size of bottom list legend adjusts depending on the height" level="h3">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ContentWithLegend
              {...args}
              width={400}
              height={200}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'bottom',
                  mode: 'list',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
            <ContentWithLegend
              {...args}
              width={400}
              height={300}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'bottom',
                  mode: 'list',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
          </Stack>
        </StorySection>
        <StorySection title="size of bottom table legend will be shorter if the items do not fill the space" level="h3">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ContentWithLegend
              {...args}
              width={400}
              height={400}
              legendProps={{
                data: generateMockLegendData(2),
                options: {
                  position: 'bottom',
                  mode: 'table',
                  size: 'small',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
            <ContentWithLegend
              {...args}
              width={400}
              height={400}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'bottom',
                  mode: 'table',
                  size: 'small',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
          </Stack>
        </StorySection>
      </Stack>
    );
  },
};

export const ChangingPosition: Story = {
  args: {},
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [position, setPosition] = useState<LegendPositions>('right');

    return (
      <Stack spacing={1}>
        <ToggleButtonGroup
          exclusive
          value={position}
          onChange={(e, value) => value && setPosition(value)}
          aria-label="text formatting"
        >
          {legendPositions.map((position) => {
            return (
              <ToggleButton key={position} value={position}>
                {position}
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>
        <ContentWithLegend
          {...args}
          legendProps={{
            data: generateMockLegendData(100),
            options: {
              position: position,
              mode: 'list',
            },
            selectedItems: {},
            onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
          }}
        />
      </Stack>
    );
  },
};
