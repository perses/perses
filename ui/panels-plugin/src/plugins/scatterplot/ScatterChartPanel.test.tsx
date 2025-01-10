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

import { PanelData } from '@perses-dev/plugin-system';
import { TraceData } from '@perses-dev/core';
import { screen, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT, MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT_EMPTY } from '../../test/';
import { getSymbolSize, ScatterChartPanel, ScatterChartPanelProps } from './ScatterChartPanel';

const TEST_SCATTER_PANEL: Omit<ScatterChartPanelProps, 'queryResults'> = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
};

describe('ScatterChartPanel', (): void => {
  const renderPanel = (queryResults: Array<PanelData<TraceData>>): void => {
    render(
      <MemoryRouter>
        <ChartsProvider chartsTheme={testChartsTheme}>
          <ScatterChartPanel {...TEST_SCATTER_PANEL} queryResults={queryResults} />
        </ChartsProvider>
      </MemoryRouter>
    );
  };

  it('should render a ScatterPlot', async () => {
    renderPanel(MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT);
    expect(await screen.findByTestId('ScatterChartPanel_ScatterPlot')).toBeInTheDocument();
  });

  it('should not render a ScatterPlot because trace results are empty', async () => {
    renderPanel(MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT_EMPTY);
    // expect it to return a Alert because the query produces no trace results
    expect(await screen.findByText('No traces')).toBeInTheDocument();
  });

  it('should scale the circles', () => {
    // apply linear scale from range [1,5] to a value from range [10,20]
    expect(getSymbolSize(1, [1, 5], [10, 20])).toEqual(10);
    expect(getSymbolSize(3, [1, 5], [10, 20])).toEqual(15);
    expect(getSymbolSize(5, [1, 5], [10, 20])).toEqual(20);

    // use max size if all span counts are same
    expect(getSymbolSize(5, [5, 5], [10, 20])).toEqual(20);
  });
});
