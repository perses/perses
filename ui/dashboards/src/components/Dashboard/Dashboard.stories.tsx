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
import { Dashboard, TemplateVariableList } from '@perses-dev/dashboards';
import { action } from '@storybook/addon-actions';
import { Button, Stack } from '@mui/material';
import { DashboardResource } from '@perses-dev/core';
import {
  WithDashboard,
  WithDatasourceStore,
  WithPluginRegistry,
  WithQueryClient,
  WithQueryParams,
  WithTemplateVariables,
  WithTimeRange,
} from '../../stories/decorators';

const meta: Meta<typeof Dashboard> = {
  component: Dashboard,
  decorators: [
    WithDashboard,
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
  },
};

export default meta;

type Story = StoryObj<typeof Dashboard>;

const DEFAULT_ALL_DASHBOARD: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'TestAll',
    created_at: '2023-03-17T20:13:03.570631Z',
    updated_at: '2023-03-17T20:13:03.570631Z',
    version: 0,
    project: 'testing',
  },
  spec: {
    display: {
      name: 'TestAll',
    },
    panels: {
      TimeSeries: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'TimeSeries',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query: 'up{instance=~"$instance"}',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      TimeSeriesGeneratedColors: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Generated Colors',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
              y_axis: {
                unit: {
                  kind: 'PercentDecimal',
                  decimal_places: 0,
                },
              },
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        query:
                          'avg without (cpu)(rate(node_cpu_seconds_total{job="$job",instance=~"$instance"}[$interval]))',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        spec: {
          display: {
            title: 'Panel Group',
            collapse: {
              open: true,
            },
          },
          items: [
            {
              x: 0,
              y: 0,
              width: 12,
              height: 8,
              content: {
                $ref: '#/spec/panels/TimeSeries',
              },
            },
            {
              x: 12,
              y: 0,
              width: 10,
              height: 8,
              content: {
                $ref: '#/spec/panels/TimeSeriesGeneratedColors',
              },
            },
          ],
        },
      },
    ],
    variables: [
      { kind: 'TextVariable', spec: { name: 'job', value: 'node' } },
      {
        kind: 'ListVariable',
        spec: {
          name: 'instance',
          display: {
            name: 'Instance',
            hidden: false,
          },
          allow_all_value: true,
          allow_multiple: true,
          default_value: ['$__all'],
          plugin: {
            kind: 'PrometheusLabelValuesVariable',
            spec: {
              label_name: 'instance',
            },
          },
        },
      },
      {
        kind: 'ListVariable',
        spec: {
          name: 'interval',
          default_value: '5m',
          allow_all_value: false,
          allow_multiple: false,
          plugin: {
            kind: 'StaticListVariable',
            spec: { values: ['1m', '5m'] },
          },
        },
      },
    ],
    duration: '5m',
  },
};

function formatProviderParameters(dashboardState: DashboardResource) {
  return {
    withDashboard: {
      props: {
        initialState: {
          dashboardResource: dashboardState,
        },
        dashboardResource: dashboardState,
      },
    },
    withDatasourceStore: {
      props: {
        dashboardResource: dashboardState,
      },
    },
    withTemplateVariables: {
      props: {
        initialVariableDefinitions: dashboardState.spec.variables,
      },
    },
    WithTimeRange: {
      props: {
        dashboardDuration: dashboardState.spec.duration,
      },
    },
  };
}

export const ListVariableWithDefaultAll: Story = {
  args: {},
  parameters: {
    happo: false,
    ...formatProviderParameters(DEFAULT_ALL_DASHBOARD),
  },
  render: (args) => {
    return (
      <Stack spacing={1}>
        <TemplateVariableList />
        <Dashboard {...args} />
      </Stack>
    );
  },
};

export const DefaultEmptyState: Story = {
  args: {},
};

export const EmptyStateWithEditButton: Story = {
  args: {
    emptyDashboardProps: {
      onEditButtonClick: action('onEditButtonClick'),
    },
  },
};

export const CustomEmptyState: Story = {
  args: {
    emptyDashboardProps: {
      title: 'Oh no!',
      description: 'This dashboard is empty.',
      additionalText: 'Tip: Add a panel group and a panel to get started.',
      actions: (
        <Button variant="outlined" color="secondary" onClick={action('click custom empty dashboard action button')}>
          click me!
        </Button>
      ),
    },
  },
};
