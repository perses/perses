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

import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartsThemeProvider, testChartsTheme } from '@perses-dev/components';
import { TimeRangeValue } from '@perses-dev/core';
import { PluginRegistry, useTimeSeriesQueries, TimeRangeContext } from '@perses-dev/plugin-system';
import { mockPluginRegistryProps, mockTimeSeriesQueryResult } from '../../test';
import { TimeSeriesChartPanel, TimeSeriesChartProps } from './TimeSeriesChartPanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useTimeSeriesQueries: jest.fn(),
  };
});

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

// Test TimeSeriesChart with legend
const TEST_TIME_SERIES_PANEL: TimeSeriesChartProps = {
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
              query: 'rate(caddy_http_response_duration_seconds_sum["5m"])',
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

describe('TimeSeriesChartPanel', () => {
  beforeEach(() => {
    (useTimeSeriesQueries as jest.Mock).mockReturnValue(mockTimeSeriesQueryResult);
  });

  // Helper to render the panel with some context set
  const renderPanel = () => {
    const { pluginRegistryProps } = mockPluginRegistryProps();

    const mockTimeRangeContext = {
      timeRange: TEST_TIME_RANGE,
      setTimeRange: () => {
        /* no-op */
      },
    };

    render(
      <PluginRegistry
        getInstalledPlugins={pluginRegistryProps.getInstalledPlugins}
        importPluginModule={pluginRegistryProps.importPluginModule}
      >
        <ChartsThemeProvider themeName="perses" chartsTheme={testChartsTheme}>
          <TimeRangeContext.Provider value={mockTimeRangeContext}>
            <TimeSeriesChartPanel {...TEST_TIME_SERIES_PANEL} />
          </TimeRangeContext.Provider>
        </ChartsThemeProvider>
      </PluginRegistry>
    );
  };

  it('should render the legend with unformatted series labels', async () => {
    renderPanel();
    expect(
      await screen.findByText(
        'device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"'
      )
    ).toBeInTheDocument();
  });

  it('should toggle selected state when a legend item is clicked', async () => {
    renderPanel();
    await userEvent.click(screen.getByTestId('legend-item-hsla(-141599372,50%,50%,0.8)'));
    expect(screen.getByTestId('legend-item-hsla(-141599372,50%,50%,0.8)')).toHaveClass('Mui-selected');
  });
});
