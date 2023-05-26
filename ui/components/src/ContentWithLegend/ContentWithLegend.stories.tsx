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
import {
  ContentWithLegend,
  LegendPositions,
  LegendProps,
  LineChart,
  legendModes,
  legendPositions,
} from '@perses-dev/components';
import { action } from '@storybook/addon-actions';
import { red, orange, yellow, green, blue, indigo, purple } from '@mui/material/colors';
import { Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { StorySection } from '@perses-dev/storybook';
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
        unit={{
          kind: 'Decimal' as const,
          decimal_places: 2,
          abbreviate: true,
        }}
      />
    ),
    width: 600,
    height: 300,
    spacing: 10,
    legendProps: {
      data: generateMockLegendData(10),
      options: {
        position: 'Right',
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

export const Mode: Story = {
  args: {},
  render: (args) => {
    return (
      <Stack spacing={3}>
        {legendModes.map((mode) => {
          return (
            <StorySection key={mode} title={mode} level="h3">
              <ContentWithLegend
                {...args}
                legendProps={{
                  data: generateMockLegendData(100),
                  options: {
                    position: 'Right',
                    mode,
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
        position: 'Right',
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
                  position: 'Right',
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
                  position: 'Bottom',
                },
                selectedItems: {},
                onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
              }}
            />
          </Stack>
        </StorySection>
        <StorySection title="size of bottom legend adjusts depending on the height" level="h3">
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <ContentWithLegend
              {...args}
              width={400}
              height={200}
              legendProps={{
                data: generateMockLegendData(10),
                options: {
                  position: 'Bottom',
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
                  position: 'Bottom',
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
    const [position, setPosition] = useState<LegendPositions>('Right');

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
              mode: 'List',
            },
            selectedItems: {},
            onSelectedItemsChange: (newSelectedItems) => action('onSelectedItemsChange')(newSelectedItems),
          }}
        />
      </Stack>
    );
  },
};
