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
  mockTimeSeriesResponseWithManySeries,
  mockTimeSeriesResponseWithNullValues,
  mockTimeSeriesResponseWithStableValue,
  mockTimeSeriesResponseWithTestData,
} from '@perses-dev/internal-utils';
import { mockQueryRangeRequests, waitForStableCanvas, WithQueryClient, WithQueryParams } from '@perses-dev/storybook';
import { WithPluginRegistry, WithTimeRange } from '@perses-dev/plugin-system/src/stories/shared-utils';
import { WithDashboard, WithDatasourceStore, WithTemplateVariables } from '../../stories/decorators';

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
            },
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
      TimeSeriesGeneratedColors: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Generated Colors',
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
              width: 12,
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
    withTimeRange: {
      props: {
        initialTimeRange: {
          pastDuration: dashboardState.spec.duration,
        },
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
              visual: { connect_nulls: true, show_points: 'Always' },
            },
          },
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
        },
      },
      CustomVisualOptions: {
        kind: 'Panel',
        spec: {
          display: { name: 'Custom Visual Options', description: 'Time series chart with custom visual options' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              visual: { area_opacity: 0.5, connect_nulls: false, line_width: 3, point_radius: 6 },
            },
          },
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
      LegendBottom: {
        kind: 'Panel',
        spec: {
          display: { name: 'Legend Position Bottom', description: 'Time series chart with a default legend' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: { position: 'Bottom' },
            },
          },
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
            },
          },
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
            },
          },
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
      SingleLine: {
        kind: 'Panel',
        spec: {
          display: { name: 'Single Line', description: 'Time series chart with a single line' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {},
          },
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
      ColorPaletteAuto: {
        kind: 'Panel',
        spec: {
          display: { name: 'Auto Palette (Many Series)', description: 'Time series chart with Auto palette example' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
              visual: { connect_nulls: true },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_twenty_series',
                  },
                },
              },
            },
          ],
        },
      },
      ColorPaletteCategorical: {
        kind: 'Panel',
        spec: {
          display: {
            name: 'Categorical Palette (Default)',
            description: 'Time series chart with Categorical palette example',
          },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
              visual: {
                palette: { kind: 'Categorical' },
                connect_nulls: true,
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_few_series',
                  },
                },
              },
            },
          ],
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
            { x: 0, y: 14, width: 8, height: 7, content: { $ref: '#/spec/panels/ColorPaletteAuto' } },
            { x: 8, y: 14, width: 8, height: 7, content: { $ref: '#/spec/panels/ColorPaletteCategorical' } },
          ],
        },
      },
    ],
  },
};

const TIMESERIES_EXAMPLE_MOCK_END = 1673805600000;
const TIMESERIES_EXAMPLE_MOCK_START = TIMESERIES_EXAMPLE_MOCK_END - 6 * 60 * 60 * 1000;
export const ExampleWithTimeSeriesPanels: Story = {
  parameters: {
    ...formatProviderParameters(TIMESERIES_EXAMPLE_DASHBOARD_RESOURCE),
    withTimeRange: {
      props: {
        initialTimeRange: {
          start: new Date(TIMESERIES_EXAMPLE_MOCK_START),
          end: new Date(TIMESERIES_EXAMPLE_MOCK_END),
        },
      },
    },
    happo: {
      beforeScreenshot: async () => {
        await waitForStableCanvas('canvas', {
          expectedCount: 8,
        });
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
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                }),
              },
            },
            {
              query: 'fake_graphite_query_with_nulls',
              response: {
                body: mockTimeSeriesResponseWithNullValues({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                }),
              },
            },
            {
              query: 'fake_query_with_few_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 7,
                }),
              },
            },
            {
              query: 'fake_query_with_twenty_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 20,
                }),
              },
            },
          ],
        }),
      },
    },
  },
};

const TIMESERIES_BENCHMARKS_DASHBOARD_RESOURCE: DashboardResource = {
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
      TwentySeries: {
        kind: 'Panel',
        spec: {
          display: { name: 'Twenty Series' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_twenty_series',
                  },
                },
              },
            },
          ],
        },
      },
      FiftySeries: {
        kind: 'Panel',
        spec: {
          display: { name: 'Fifty Series' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_fifty_series',
                  },
                },
              },
            },
          ],
        },
      },
      OneHundredSeries: {
        kind: 'Panel',
        spec: {
          display: { name: 'One Hundred Series' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_one_hundred_series',
                  },
                },
              },
            },
          ],
        },
      },
      FiveHundredSeries: {
        kind: 'Panel',
        spec: {
          display: { name: 'Five Hundred Series' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_five_hundred_series',
                  },
                },
              },
            },
          ],
        },
      },
      OneThousandSeries: {
        kind: 'Panel',
        spec: {
          display: { name: 'One Thousand Series' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_query_with_one_thousand_series',
                  },
                },
              },
            },
          ],
        },
      },
      MockResponseFirst: {
        kind: 'Panel',
        spec: {
          display: { name: 'Mock Response (168 series)' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_range_query_mock_response_1',
                  },
                },
              },
            },
          ],
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        spec: {
          display: { title: 'Row 1', collapse: { open: true } },
          items: [
            { x: 0, y: 0, width: 12, height: 8, content: { $ref: '#/spec/panels/TwentySeries' } },
            { x: 12, y: 0, width: 12, height: 8, content: { $ref: '#/spec/panels/FiftySeries' } },
            { x: 0, y: 8, width: 12, height: 8, content: { $ref: '#/spec/panels/OneHundredSeries' } },
            { x: 12, y: 8, width: 12, height: 8, content: { $ref: '#/spec/panels/FiveHundredSeries' } },
          ],
        },
      },
      {
        kind: 'Grid',
        spec: {
          display: { title: 'Row 2', collapse: { open: false } },
          items: [{ x: 0, y: 0, width: 24, height: 12, content: { $ref: '#/spec/panels/TwoThousandSeries' } }],
        },
      },
    ],
  },
};

const TIMESERIES_ALT_EXAMPLE_MOCK_START = TIMESERIES_EXAMPLE_MOCK_END - 2 * 60 * 60 * 1000;
export const ExampleWithManySeries: Story = {
  parameters: {
    ...formatProviderParameters(TIMESERIES_BENCHMARKS_DASHBOARD_RESOURCE),
    withTimeRange: {
      props: {
        initialTimeRange: {
          start: new Date(TIMESERIES_ALT_EXAMPLE_MOCK_START),
          end: new Date(TIMESERIES_EXAMPLE_MOCK_END),
        },
      },
    },
    msw: {
      handlers: {
        queryRange: mockQueryRangeRequests({
          queries: [
            {
              query: 'fake_query_with_few_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_ALT_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 7,
                }),
              },
            },
            {
              query: 'fake_query_with_twenty_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 20,
                }),
              },
            },
            {
              query: 'fake_query_with_fifty_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 50,
                }),
              },
            },
            {
              query: 'fake_query_with_one_hundred_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 100,
                }),
              },
            },
            {
              query: 'fake_query_with_five_hundred_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 500,
                }),
              },
            },
            {
              query: 'fake_query_with_one_thousand_series',
              response: {
                body: mockTimeSeriesResponseWithManySeries({
                  startTimeMs: TIMESERIES_EXAMPLE_MOCK_START,
                  endTimeMs: TIMESERIES_EXAMPLE_MOCK_END,
                  totalSeries: 1000,
                }),
              },
            },
          ],
        }),
      },
    },
  },
};

const TIMESERIES_MOCK_DATA_DASHBOARD_RESOURCE: DashboardResource = {
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
      MockResponseFirst: {
        kind: 'Panel',
        spec: {
          display: { name: 'Mock Response First' },
          plugin: {
            kind: 'TimeSeriesChart',
            spec: {
              legend: {
                position: 'Right',
              },
            },
          },
          queries: [
            {
              kind: 'TimeSeriesQuery',
              spec: {
                plugin: {
                  kind: 'PrometheusTimeSeriesQuery',
                  spec: {
                    datasource: { kind: 'PrometheusDatasource', name: 'PrometheusDemo' },
                    query: 'fake_range_query_mock_response_1',
                  },
                },
              },
            },
          ],
        },
      },
    },
    layouts: [
      {
        kind: 'Grid',
        spec: {
          display: { title: 'Row 1', collapse: { open: true } },
          items: [{ x: 0, y: 0, width: 24, height: 12, content: { $ref: '#/spec/panels/MockResponseFirst' } }],
        },
      },
    ],
  },
};

export const ExampleWithTestData: Story = {
  parameters: {
    happo: false,
    ...formatProviderParameters(TIMESERIES_MOCK_DATA_DASHBOARD_RESOURCE),
    withTimeRange: {
      props: {
        initialTimeRange: {
          start: new Date(1684559580 * 1000),
          end: new Date(1684573395 * 1000),
        },
      },
    },
    msw: {
      handlers: {
        queryRange: mockQueryRangeRequests({
          queries: [
            {
              query: 'fake_range_query_mock_response_1',
              response: {
                body: mockTimeSeriesResponseWithTestData(),
              },
            },
          ],
        }),
      },
    },
  },
};
