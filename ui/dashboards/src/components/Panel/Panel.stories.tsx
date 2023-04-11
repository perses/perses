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

import type { Meta, StoryFn, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Box } from '@mui/material';
import { Panel } from '@perses-dev/dashboards';
import { PanelDefinition } from '@perses-dev/core';
import {
  WithPluginRegistry,
  WithTimeRange,
  WithQueryClient,
  WithQueryParams,
  WithTemplateVariables,
  WithDatasourceStore,
} from '../../stories/decorators';

const panelDefinition: PanelDefinition = {
  kind: 'Panel',
  spec: {
    display: { name: 'Single Query', description: 'This is a panel rendering a time series chart' },
    plugin: {
      kind: 'TimeSeriesChart',
      spec: {
        queries: [
          {
            kind: 'TimeSeriesQuery',
            spec: {
              plugin: {
                kind: 'PrometheusTimeSeriesQuery',
                spec: {
                  query: 'up',
                },
              },
            },
          },
        ],
      },
    },
  },
};

const meta: Meta<typeof Panel> = {
  component: Panel,
  decorators: [
    WithTemplateVariables,
    WithTimeRange,
    WithDatasourceStore,
    WithPluginRegistry,
    WithQueryClient,
    WithQueryParams,
  ],
  parameters: {
    // Overriding the default on* regex for actions becaues we expose a LOT
    // of these by exposing the MUI BoxProps, and it was making the storybook
    // and browser hang from the numerous actions happening when you interacted
    // with the page.
    actions: { argTypesRegex: '' },
    happo: false,
  },
  args: {
    definition: panelDefinition,
  },
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const ViewMode: StoryFn<typeof Panel> = (args) => {
  return (
    <Box width={'500px'} height={'300px'}>
      <Panel {...args} />
    </Box>
  );
};

export const EditMode: StoryFn<typeof Panel> = (args) => {
  return (
    <Box width={'500px'} height={'300px'}>
      <Panel {...args} />
    </Box>
  );
};

EditMode.args = {
  editHandlers: {
    onEditPanelClick: action('edit panel clicked'),
    onDuplicatePanelClick: action('duplicate panel clicked'),
    onDeletePanelClick: action('delete panel clicked'),
  },
};

/**
 * You can use the props to customize the messaging and actions.
 */
const customAxisPanel: PanelDefinition = {
  kind: 'Panel',
  spec: {
    display: { name: 'Custom Y Axis', description: 'This is a panel showing custom y axis options' },
    plugin: {
      kind: 'TimeSeriesChart',
      spec: {
        y_axis: {
          show: true,
          label: 'Axis Label',
          unit: {
            kind: 'Decimal',
            decimal_places: 1,
            abbreviate: true,
          },
          max: 1200,
        },
        queries: [
          {
            kind: 'TimeSeriesQuery',
            spec: {
              plugin: {
                kind: 'PrometheusTimeSeriesQuery',
                spec: {
                  query: 'node_network_transmit_queue_length',
                },
              },
            },
          },
        ],
      },
    },
  },
};
export const AxisCustom: Story = {
  args: {
    definition: customAxisPanel,
  },
  parameters: {
    actions: { argTypesRegex: '' },
    happo: false,
  },
  render: (args) => {
    return (
      <Box width={'500px'} height={'300px'}>
        <Panel {...args} />
      </Box>
    );
  },
};
