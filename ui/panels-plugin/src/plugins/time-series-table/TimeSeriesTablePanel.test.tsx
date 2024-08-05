// Copyright 2024 The Perses Authors
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

import {
  MockPlugin,
  mockPluginRegistry,
  PluginRegistry,
  TimeRangeContext,
  TimeSeriesQueryPlugin,
  useDataQueries,
} from '@perses-dev/plugin-system';
import { TimeRangeValue, TimeSeriesData, toAbsoluteTimeRange, UnknownSpec } from '@perses-dev/core';
import { TimeSeriesTableProps } from '@perses-dev/panels-plugin';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { ChartsProvider, SnackbarProvider, testChartsTheme } from '@perses-dev/components';
import {
  MOCK_TIME_SERIES_DATA_MULTIVALUE,
  MOCK_TIME_SERIES_DATA_SINGLEVALUE,
  MOCK_TIME_SERIES_QUERY_RESULT_MULTIVALUE,
  MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE,
} from '../../test';
import { TimeSeriesTablePanel } from './TimeSeriesTablePanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueries: jest.fn(),
  };
});

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

function buildFakeTimeSeriesQuery(data: TimeSeriesData): TimeSeriesQueryPlugin<UnknownSpec> {
  return {
    getTimeSeriesData: async () => {
      return data;
    },
    OptionsEditorComponent: () => {
      return <div>Edit options here</div>;
    },
    createInitialOptions: () => ({}),
  };
}

function buildMockQueryPlugin(data: TimeSeriesData): MockPlugin {
  return {
    pluginType: 'TimeSeriesQuery',
    kind: 'PrometheusTimeSeriesQuery',
    plugin: buildFakeTimeSeriesQuery(data),
  };
}

const TEST_TIME_SERIES_TABLE_PROPS: TimeSeriesTableProps = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
};

describe('TimeSeriesTablePanel', () => {
  // Helper to render the panel with some context set
  const renderPanel = (data: TimeSeriesData) => {
    const mockTimeRangeContext = {
      refreshIntervalInMs: 0,
      setRefreshInterval: () => ({}),
      timeRange: TEST_TIME_RANGE,
      setTimeRange: () => ({}),
      absoluteTimeRange: toAbsoluteTimeRange(TEST_TIME_RANGE),
      refresh: jest.fn(),
      refreshKey: `${TEST_TIME_RANGE.pastDuration}:0`,
    };

    render(
      <SnackbarProvider>
        <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
          <PluginRegistry {...mockPluginRegistry(buildMockQueryPlugin(data))}>
            <ChartsProvider chartsTheme={testChartsTheme}>
              <TimeRangeContext.Provider value={mockTimeRangeContext}>
                <TimeSeriesTablePanel {...TEST_TIME_SERIES_TABLE_PROPS} />
              </TimeRangeContext.Provider>
            </ChartsProvider>
          </PluginRegistry>
        </VirtuosoMockContext.Provider>
      </SnackbarProvider>
    );
  };

  it('should render multi values with timestamps', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TIME_SERIES_QUERY_RESULT_MULTIVALUE,
      isLoading: false,
      isFetching: false,
    });
    renderPanel(MOCK_TIME_SERIES_DATA_MULTIVALUE);

    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent ===
          '{device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"}'
      ).length
    ).toBeGreaterThan(0);

    expect(await screen.findAllByRole('cell')).toHaveLength(4); // 2 lines with 2 column
    expect(await screen.findAllByText('@1666479357903')).toHaveLength(2); // first timestamp appear once per line
    expect(await screen.findAllByText('@1666479382282')).toHaveLength(2); // second timestamp appear once per line
  });

  it('should render single value without timestamp', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE,
      isLoading: false,
      isFetching: false,
    });
    renderPanel(MOCK_TIME_SERIES_DATA_SINGLEVALUE);

    expect(
      screen.getAllByText(
        (_, element) =>
          element?.textContent ===
          '{device="/dev/vda1", env="demo", fstype="ext4", instance="demo.do.prometheus.io:9100", job="node", mountpoint="/"}'
      ).length
    ).toBeGreaterThan(0);

    expect(await screen.findAllByRole('cell')).toHaveLength(4); // 2 lines with 2 column
    expect(screen.queryByText('@')).toBeNull(); // No @ as no timestamp
  });
});
