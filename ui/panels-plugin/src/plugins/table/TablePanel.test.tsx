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

import { screen, render, within } from '@testing-library/react';
import { TimeRangeValue, TimeSeriesData, toAbsoluteTimeRange, UnknownSpec } from '@perses-dev/core';
import {
  MockPlugin,
  mockPluginRegistry,
  PluginRegistry,
  TimeRangeContext,
  TimeSeriesQueryPlugin,
  useDataQueries,
} from '@perses-dev/plugin-system';
import { TableOptions, TimeSeriesTableProps } from '@perses-dev/panels-plugin';
import { VirtuosoMockContext } from 'react-virtuoso';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { ReactElement } from 'react';
import { MOCK_TIME_SERIES_DATA_SINGLEVALUE, MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE } from '../../test';
import { TablePanel } from './TablePanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueries: jest.fn(),
  };
});

function buildFakeTimeSeriesQuery(data: TimeSeriesData): TimeSeriesQueryPlugin<UnknownSpec> {
  return {
    getTimeSeriesData: async (): Promise<TimeSeriesData> => {
      return data;
    },
    OptionsEditorComponent: (): ReactElement => {
      return <div>Edit options here</div>;
    },
    createInitialOptions: () => ({}),
  };
}

function buildMockQueryPlugin(data: TimeSeriesData): MockPlugin {
  return {
    kind: 'TimeSeriesQuery',
    spec: { name: 'PrometheusTimeSeriesQuery' },
    plugin: buildFakeTimeSeriesQuery(data),
  };
}

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

const TEST_TIME_SERIES_TABLE_PROPS: TimeSeriesTableProps = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
  queryResults: [],
};

describe('TablePanel', () => {
  // Helper to render the panel with some context set
  const renderPanel = (data: TimeSeriesData, options?: TableOptions): void => {
    const mockTimeRangeContext = {
      refreshIntervalInMs: 0,
      setRefreshInterval: (): Record<string, unknown> => ({}),
      timeRange: TEST_TIME_RANGE,
      setTimeRange: (): Record<string, unknown> => ({}),
      absoluteTimeRange: toAbsoluteTimeRange(TEST_TIME_RANGE),
      refresh: jest.fn(),
      refreshKey: `${TEST_TIME_RANGE.pastDuration}:0`,
    };

    render(
      <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
        <PluginRegistry {...mockPluginRegistry(buildMockQueryPlugin(data))}>
          <ChartsProvider chartsTheme={testChartsTheme}>
            <TimeRangeContext.Provider value={mockTimeRangeContext}>
              <TablePanel {...TEST_TIME_SERIES_TABLE_PROPS} spec={options ?? {}} />
            </TimeRangeContext.Provider>
          </ChartsProvider>
        </PluginRegistry>
      </VirtuosoMockContext.Provider>
    );
  };

  it('should render time series in table', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE,
      isLoading: false,
      isFetching: false,
    });
    renderPanel(MOCK_TIME_SERIES_DATA_SINGLEVALUE);

    expect(await screen.findAllByRole('columnheader')).toHaveLength(8); // 1 timestamp column +  1 value column + 6 labels columns
    expect(await screen.findByRole('columnheader', { name: 'timestamp' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'value' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'device' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'env' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'fstype' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'instance' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'job' })).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: 'mountpoint' })).toBeInTheDocument();

    expect(await screen.findAllByRole('cell')).toHaveLength(16); // 2 time series with 8 columns
  }, 15000); // Github Actions is slow

  it('should apply column settings', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE,
      isLoading: false,
      isFetching: false,
    });
    renderPanel(MOCK_TIME_SERIES_DATA_SINGLEVALUE, {
      columnSettings: [
        { name: 'value', header: 'Value', headerDescription: 'Timeseries Value' },
        { name: 'device', width: 200 },
        { name: 'env', hide: true },
        { name: 'fstype', enableSorting: true },
      ],
    });

    expect(await screen.findAllByRole('columnheader')).toHaveLength(7); // 1 timestamp column +  1 value column + 6 labels columns - 1 column hidden
    expect(screen.queryByRole('columnheader', { name: 'env' })).not.toBeInTheDocument();

    const valueHeaderCell = await screen.findByRole('columnheader', { name: /Value/i });
    expect(valueHeaderCell).toBeInTheDocument();
    expect(await within(valueHeaderCell).findByLabelText('Timeseries Value')).toBeInTheDocument();
    expect(await screen.findByRole('columnheader', { name: /Value/i })).toBeInTheDocument();

    const fstypeHeaderCell = await screen.findByRole('columnheader', { name: 'fstype' });
    expect(fstypeHeaderCell).toBeInTheDocument();
    expect(await within(fstypeHeaderCell).findByTestId('ArrowDownwardIcon')).toBeInTheDocument();

    expect(await screen.findAllByRole('cell')).toHaveLength(14); // 2 time series with 7 columns
  });

  it('should apply transforms', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TIME_SERIES_QUERY_RESULT_SINGLEVALUE,
      isLoading: false,
      isFetching: false,
    });
    renderPanel(MOCK_TIME_SERIES_DATA_SINGLEVALUE, {
      transforms: [
        {
          kind: 'JoinByColumnValue',
          spec: {
            columns: ['env'],
          },
        },
      ],
    });

    expect(await screen.findAllByRole('cell')).toHaveLength(8); // 1 row of 8 columns (not joined => 16)
    expect(await screen.findByRole('cell', { name: 'demo' })).toBeInTheDocument();
  });
});
