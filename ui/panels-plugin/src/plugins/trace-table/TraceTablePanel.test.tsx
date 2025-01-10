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

import { PanelData } from '@perses-dev/plugin-system';
import { TraceData } from '@perses-dev/core';
import { render, screen } from '@testing-library/react';
import { ChartsProvider, testChartsTheme } from '@perses-dev/components';
import { MemoryRouter } from 'react-router-dom';
import { MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT } from '../../test';
import { TraceTablePanel, TraceTablePanelProps } from './TraceTablePanel';

const TEST_TRACE_TABLE_PROPS: Omit<TraceTablePanelProps, 'queryResults'> = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
};

describe('TraceTablePanel', () => {
  // Helper to render the panel with some context set
  const renderPanel = (queryResults: Array<PanelData<TraceData>>): void => {
    render(
      <MemoryRouter>
        <ChartsProvider chartsTheme={testChartsTheme}>
          <TraceTablePanel {...TEST_TRACE_TABLE_PROPS} queryResults={queryResults} />
        </ChartsProvider>
      </MemoryRouter>
    );
  };

  it('should render multi values with timestamps', async () => {
    renderPanel(MOCK_TRACE_SEARCH_RESULT_QUERY_RESULT);

    const rows = screen.getAllByRole('row');
    const lastRow = rows[rows.length - 1];
    expect(lastRow).toHaveTextContent('service-name: span-name'); // trace name
    expect(lastRow).toHaveTextContent('10service-name'); // service name <Chip>s
    expect(lastRow).toHaveTextContent('3second-service-name'); // service name <Chip>s
    expect(lastRow).toHaveTextContent('13 spans'); // span count
    expect(lastRow).toHaveTextContent('2 errors'); // span count
    expect(lastRow).toHaveTextContent('100ms'); // duration
    expect(lastRow).toHaveTextContent('December 18, 2023 at 4:07:25 PM'); // start time
  });
});
