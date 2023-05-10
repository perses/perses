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
import { TimeSeriesChart } from '@perses-dev/panels-plugin';
import {
  WithDataQueries,
  WithPluginRegistry,
  WithTimeRange,
  WithTemplateVariables,
  WithDatasourceStore,
} from '@perses-dev/plugin-system/src/stories/shared-utils';
import { WithQueryParams, WithQueryClient } from '@perses-dev/storybook';
import { ComponentProps } from 'react';

type TimeSeriesChartProps = ComponentProps<typeof TimeSeriesChart.PanelComponent>;

type TimeSeriesChartWrapperProps = TimeSeriesChartProps & {
  height?: number;
  width?: number;
};
function TimeSeriesChartWrapper({ height, width, ...otherProps }: TimeSeriesChartWrapperProps) {
  return (
    <div style={{ width: width, height: height }}>
      <TimeSeriesChart.PanelComponent {...otherProps} />
    </div>
  );
}

// TODO: mock the data response, so we can do visual testing.
const meta: Meta<typeof TimeSeriesChart.PanelComponent> = {
  component: TimeSeriesChart.PanelComponent,
  argTypes: {},
  parameters: {
    WithDataQueries: {
      props: {
        definitions: [
          {
            kind: 'PrometheusTimeSeriesQuery',
            spec: {
              query: 'up',
            },
          },
        ],
      },
    },
  },
  decorators: [
    WithDataQueries,
    WithTemplateVariables,
    WithDatasourceStore,
    WithPluginRegistry,
    WithTimeRange,
    WithQueryClient,
    WithQueryParams,
  ],
  render: (args) => {
    return (
      <TimeSeriesChartWrapper width={args.contentDimensions?.width} height={args.contentDimensions?.height} {...args} />
    );
  },
};

export default meta;

type Story = StoryObj<typeof TimeSeriesChart.PanelComponent>;

export const Primary: Story = {
  args: {
    contentDimensions: {
      width: 600,
      height: 400,
    },
    spec: {
      legend: {
        position: 'Bottom',
        mode: 'Table',
      },
    },
  },
};
