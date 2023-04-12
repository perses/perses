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
  mockTimeSeriesResponseWithNullValues,
  mockTimeSeriesResponseWithStableValue,
} from '@perses-dev/internal-utils';
import { mockQueryRangeRequests, waitForStableCanvas } from '@perses-dev/storybook';
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
              width: 10,
              height: 8,
              content: {
                $ref: '#/spec/panels/TimeSeries',
              },
            },
          ],
        },
      },
    ],
    variables: [
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
    withTimeRange: {
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

const TIMESERIES_EXAMPLE_DASHBOARD_RESOURCE: DashboardResource = {
  kind: 'Dashboard',
  metadata: {
    name: 'TimeSeriesChartPanel',
    created_at: '2022-12-21T00:00:00Z',
    updated_at: '2023-01-25T17:43:56.745494Z',
    version: 3,
    project: 'testing',
  },
  spec: {
    duration: '6h',
    variables: [],
    panels: {
      ConnectedNulls: {
        kind: 'Panel',
        spec: {
          display: { name: 'Connected Nulls', description: 'Time series chart with connected null values' },
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
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'fake_graphite_query_with_nulls',
                      },
                    },
                  },
                },
              ],
              visual: { connect_nulls: true, show_points: 'Always' },
            },
          },
        },
      },
      CustomVisualOptions: {
        kind: 'Panel',
        spec: {
          display: { name: 'Custom Visual Options', description: 'Time series chart with custom visual options' },
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
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
                      },
                    },
                  },
                },
              ],
              visual: { area_opacity: 0.5, connect_nulls: false, line_width: 3, point_radius: 6 },
            },
          },
        },
      },
      LegendBottom: {
        kind: 'Panel',
        spec: {
          display: { name: 'Legend Position Bottom', description: 'Time series chart with a default legend' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: { position: 'Bottom' },
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      LegendRight: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Legend Position Right',
            description: 'Time series chart with a legend positioned to the right',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: { position: 'Right' },
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      LegendTallFormatted: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Legend Tall Formatted',
            description: 'Time series chart with large legend and formatted series names',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: { position: 'Bottom' },
              queries: [
                {
                  kind: 'TimeSeriesQuery',
                  spec: {
                    plugin: {
                      kind: 'PrometheusTimeSeriesQuery',
                      spec: {
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
                        series_name_format: 'formatted series name example - {{job}} job - instance {{instance}}',
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      },
      SingleLine: {
        kind: 'Panel',
        spec: {
          display: { name: 'Single Line', description: 'Time series chart with a single line' },
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
                        datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                        query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
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
          display: { title: 'Row 1', collapse: { open: true } },
          items: [
            { x: 0, y: 0, width: 8, height: 7, content: { $ref: '#/spec/panels/SingleLine' } },
            { x: 8, y: 0, width: 8, height: 7, content: { $ref: '#/spec/panels/CustomVisualOptions' } },
            { x: 16, y: 0, width: 8, height: 7, content: { $ref: '#/spec/panels/ConnectedNulls' } },
            { x: 0, y: 7, width: 8, height: 7, content: { $ref: '#/spec/panels/LegendBottom' } },
            { x: 8, y: 7, width: 8, height: 7, content: { $ref: '#/spec/panels/LegendRight' } },
            { x: 16, y: 7, width: 8, height: 10, content: { $ref: '#/spec/panels/LegendTallFormatted' } },
          ],
        },
      },
    ],
  },
};

const TIMESERIES_EXAMPLE_MOCK_NOW = 1673805600000;
const TIMESERIES_EXAMPLE_MOCK_START = TIMESERIES_EXAMPLE_MOCK_NOW - 6 * 60 * 60 * 1000;
export const ExampleWithTimeSeriesPanels: Story = {
  parameters: {
    ...formatProviderParameters(TIMESERIES_EXAMPLE_DASHBOARD_RESOURCE),
    withTimeRange: {
      props: {
        initialTimeRange: {
          start: TIMESERIES_EXAMPLE_MOCK_START,
          end: TIMESERIES_EXAMPLE_MOCK_NOW,
        },
      },
    },
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas');
      },
    },
    msw: {
      handlers: {
        queryRange: mockQueryRangeRequests({
          queries: [
            {
              query: 'up{job="grafana",instance="demo.do.prometheus.io:3000"}',
              response: {
                body: mockTimeSeriesResponseWithStableValue({
                  metrics: [
                    {
                      metric: {
                        __name__: 'up',
                        instance: 'demo.do.prometheus.io:3000',
                        job: 'grafana',
                      },
                      value: '1',
                    },
                  ],
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_NOW,
                }),
              },
            },
            {
              query: 'fake_graphite_query_with_nulls',
              response: {
                body: mockTimeSeriesResponseWithNullValues({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_NOW,
                }),
              },
            },
          ],
        }),
      },
    },
  },
};
