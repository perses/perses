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
  TraceQueryPlugin,
  useDataQueries,
} from '@perses-dev/plugin-system';
import { TimeRangeValue, toAbsoluteTimeRange, UnknownSpec } from '@perses-dev/core';
import { render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_TRACE_QUERY_RESULT } from '../../test';
import { TraceTablePanel, TraceTableProps } from './TraceTablePanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueries: jest.fn(),
  };
});

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

function buildFakeTraceQuery(): TraceQueryPlugin<UnknownSpec> {
  return {
    getTraceData: async () => {
      throw Error('not implemented');
    },
    createInitialOptions: () => ({}),
  };
}

function buildMockQueryPlugin(): MockPlugin {
  return {
    pluginType: 'TraceQuery',
    kind: 'TempoTraceQuery',
    plugin: buildFakeTraceQuery(),
  };
}

const TEST_TRACE_TABLE_PROPS: TraceTableProps = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
};

describe('TraceTablePanel', () => {
  // Helper to render the panel with some context set
  const renderPanel = () => {
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
      <MemoryRouter>
        <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
          <PluginRegistry {...mockPluginRegistry(buildMockQueryPlugin())}>
            <ChartsProvider chartsTheme={testChartsTheme}>
              <TimeRangeContext.Provider value={mockTimeRangeContext}>
                <TraceTablePanel {...TEST_TRACE_TABLE_PROPS} />
              </TimeRangeContext.Provider>
            </ChartsProvider>
          </PluginRegistry>
        </VirtuosoMockContext.Provider>
      </MemoryRouter>
    );
  };

  it('should render multi values with timestamps', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TRACE_QUERY_RESULT,
      isLoading: false,
      isFetching: false,
    });
    renderPanel();

    expect(await screen.findByText('service-name')).toBeInTheDocument();
    expect(await screen.findByText('span-name')).toBeInTheDocument();
    expect(await screen.findByText('13 spans')).toBeInTheDocument();
    expect(await screen.findByText('2 errors')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    const lastRow = rows[rows.length - 1];
    expect(lastRow).toHaveTextContent('10service-name'); // check service <Chip>s
    expect(lastRow).toHaveTextContent('3second-service-name');

    expect(await screen.findAllByRole('cell')).toHaveLength(4); // 1 line with 4 columns
  });
});
