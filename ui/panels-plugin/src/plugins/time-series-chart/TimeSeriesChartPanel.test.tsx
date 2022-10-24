// Copyright 2022 The Perses Authors
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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChartsThemeProvider } from '@perses-dev/components';
import { PluginRegistry, useTimeSeriesQueries, TimeRangeContext } from '@perses-dev/plugin-system';
import { screen, render } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { mockPluginRegistryProps, mockTimeSeriesQueryResult } from '../../test';
import { TimeSeriesChartPanel, TimeSeriesChartProps } from './TimeSeriesChartPanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useTimeSeriesQueries: jest.fn(),
  };
});

describe('TimeSeriesChartPanel', () => {
  // beforeEach(() => {
  //   (useTimeSeriesQueries as jest.Mock).mockReturnValue(mockTimeSeriesQueryResult);
  //   (useTimeRange as jest.Mock).mockReturnValue({ start: new Date(), end: new Date() });
  // });

  // Test TimeSeriesChart with legend
  const testPanel: TimeSeriesChartProps = {
    contentDimensions: {
      width: 500,
      height: 500,
    },
    spec: {
      queries: [
        {
          kind: 'TimeSeriesQuery',
          spec: {
            plugin: {
              kind: 'PrometheusTimeSeriesQuery',
              spec: {
                query: 'rate(caddy_http_response_duration_seconds_sum[$interval])',
                // query: 'histogram_quantile(0.9, rate(caddy_http_request_duration_seconds_bucket[$interval]))',
              },
            },
          },
        },
      ],
      unit: { kind: 'Decimal', decimal_places: 2 },
      legend: {
        position: 'right',
      },
    },
  };

  const queryClient = new QueryClient();

  // Helper to render the panel with some context set
  const renderPanel = () => {
    const { pluginRegistryProps } = mockPluginRegistryProps();

    // (useTimeSeriesQueries as jest.Mock).mockReturnValue([mockTimeSeriesQueryResult]);
    (useTimeSeriesQueries as jest.Mock).mockReturnValue(mockTimeSeriesQueryResult);

    // (useTimeRange as jest.Mock).mockReturnValue({ start: new Date(), end: new Date() });

    const mockTimeRangeContext = {
      timeRange: { pastDuration: '1h' },
      setTimeRange: () => {
        /* no-op */
      },
    };

    render(
      <QueryClientProvider client={queryClient}>
        <PluginRegistry
          getInstalledPlugins={pluginRegistryProps.getInstalledPlugins}
          importPluginModule={pluginRegistryProps.importPluginModule}
        >
          <ChartsThemeProvider themeName="perses" chartsTheme={{}}>
            <TimeRangeContext.Provider value={mockTimeRangeContext}>
              <TimeSeriesChartPanel {...testPanel} />
            </TimeRangeContext.Provider>
          </ChartsThemeProvider>
        </PluginRegistry>
      </QueryClientProvider>
    );
  };

  it('should render legend when spec.legend is populated', async () => {
    renderPanel();
    expect(
      await screen.findByText(
        'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"'
      )
    ).toBeInTheDocument();
  });
});
