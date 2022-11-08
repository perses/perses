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
import { TimeRangeValue, UnknownSpec } from '@perses-dev/core';
import {
  PluginRegistry,
  useTimeSeriesQueries,
  TimeRangeContext,
  TimeSeriesQueryPlugin,
  mockPluginRegistry,
  MockPlugin,
} from '@perses-dev/plugin-system';
import { MOCK_TIME_SERIES_QUERY_RESULT, MOCK_TIME_SERIES_DATA } from '../../test';
import { TimeSeriesChartPanel, TimeSeriesChartProps } from './TimeSeriesChartPanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useTimeSeriesQueries: jest.fn(),
  };
});

const FakeTimeSeriesQuery: TimeSeriesQueryPlugin<UnknownSpec> = {
  getTimeSeriesData: async () => {
    return MOCK_TIME_SERIES_DATA;
  },
  OptionsEditorComponent: () => {
    return <div>Edit options here</div>;
  },
  createInitialOptions: () => ({}),
};

const MOCK_PROM_QUERY_PLUGIN: MockPlugin = {
  pluginType: 'TimeSeriesQuery',
  kind: 'PrometheusTimeSeriesQuery',
  plugin: FakeTimeSeriesQuery,
};

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

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
    // TODO: remove and instead use addMockPlugin after rest of runtime dependencies are mocked
    (useTimeSeriesQueries as jest.Mock).mockReturnValue(MOCK_TIME_SERIES_QUERY_RESULT);
  });

  // Helper to render the panel with some context set
  const renderPanel = () => {
    const mockTimeRangeContext = {
      timeRange: TEST_TIME_RANGE,
      setTimeRange: () => ({}),
    };

    render(
      <PluginRegistry {...mockPluginRegistry(MOCK_PROM_QUERY_PLUGIN)}>
        <ChartsThemeProvider chartsTheme={testChartsTheme}>
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
