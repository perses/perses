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

import {
  TraceQueryPlugin,
  MockPlugin,
  useDataQueries,
  PluginRegistry,
  TimeRangeContext,
  mockPluginRegistry,
} from '@perses-dev/plugin-system';
import { UnknownSpec, TimeRangeValue, toAbsoluteTimeRange } from '@perses-dev/core';
import { screen, render } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { MOCK_TRACE_DATA, MOCK_TRACE_QUERY_RESULT, MOCK_EMPTY_TRACE_QUERY_RESULT } from '../../test/';
import { ScatterChartPanel, ScatterChartPanelProps } from './ScatterChartPanel';

jest.mock('@perses-dev/plugin-system', () => {
  return {
    ...jest.requireActual('@perses-dev/plugin-system'),
    useDataQueries: jest.fn(),
  };
});

const FakeTraceQueryPlugin: TraceQueryPlugin<UnknownSpec> = {
  getTraceData: async () => {
    return MOCK_TRACE_DATA;
  },
  createInitialOptions: () => ({}),
};

const MOCK_TRACE_QUERY_PLUGIN: MockPlugin = {
  pluginType: 'TraceQuery',
  kind: 'TempoTraceQuery',
  plugin: FakeTraceQueryPlugin,
};

const TEST_SCATTER_PANEL: ScatterChartPanelProps = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {
    query: {
      kind: 'TraceQuery',
      spec: {
        plugin: {
          kind: 'TempoTraceQuery',
          spec: {
            query: '{duration>500ms}',
          },
        },
      },
    },
  },
};

const TEST_TIME_RANGE: TimeRangeValue = { pastDuration: '1h' };

describe('ScatterChartPanel', () => {
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
      <VirtuosoMockContext.Provider value={{ viewportHeight: 600, itemHeight: 100 }}>
        <PluginRegistry {...mockPluginRegistry(MOCK_TRACE_QUERY_PLUGIN)}>
          <ChartsProvider chartsTheme={testChartsTheme}>
            <TimeRangeContext.Provider value={mockTimeRangeContext}>
              <ScatterChartPanel {...TEST_SCATTER_PANEL} />
            </TimeRangeContext.Provider>
          </ChartsProvider>
        </PluginRegistry>
      </VirtuosoMockContext.Provider>
    );
  };

  it('should render a ScatterPlot', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_TRACE_QUERY_RESULT,
      isLoading: false,
      isFetching: false,
    });
    renderPanel();
    expect(await screen.findByTestId('ScatterChartPanel_ScatterPlot')).toBeInTheDocument();
  });

  it('should not render a ScatterPlot because trace results are empty', async () => {
    (useDataQueries as jest.Mock).mockReturnValue({
      queryResults: MOCK_EMPTY_TRACE_QUERY_RESULT,
      isLoading: false,
      isFetching: false,
    });
    renderPanel();
    // expect it to return a Alert because the query produces no trace results
    expect(await screen.findByText('No traces')).toBeInTheDocument();
  });
});
