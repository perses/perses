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

import { render, RenderResult, screen } from '@testing-library/react';
import { DEFAULT_PROM } from '@perses-dev/prometheus-plugin';
import { VirtuosoMockContext } from 'react-virtuoso';
import { MemoryRouter } from 'react-router-dom';
import { MetricList, MetricListProps } from './MetricList';

jest.mock('../../utils', () => ({
  useMetricMetadata: jest
    .fn()
    .mockReturnValue({ metadata: { type: 'gauge', help: 'my super metric desc' }, isLoading: false }),
}));

jest.mock('../../../ExploreManager/query-params', () => ({
  useExplorerQueryParams: jest.fn().mockReturnValue('?explorer=metrics'),
}));

describe('MetricList', () => {
  const renderList = ({
    metricNames = [],
    datasource = DEFAULT_PROM,
    filters = [],
    isMetadataEnabled,
    onExplore,
  }: Partial<MetricListProps>): RenderResult =>
    render(
      <MemoryRouter>
        <VirtuosoMockContext.Provider value={{ viewportHeight: 400, itemHeight: 25 }}>
          <MetricList
            metricNames={metricNames}
            datasource={datasource}
            filters={filters}
            isMetadataEnabled={isMetadataEnabled}
            onExplore={onExplore}
          />
        </VirtuosoMockContext.Provider>
      </MemoryRouter>
    );

  it('should render metrics', () => {
    renderList({
      metricNames: ['metric1', 'metric2'],
    });

    expect(screen.getByText('metric1')).toBeInTheDocument();
    expect(screen.getByText('metric2')).toBeInTheDocument();
    expect(screen.getByTestId('finder-total').textContent).toEqual('Total: 2 metrics');
  });

  it('should display metadata', () => {
    renderList({
      metricNames: ['metric1', 'metric2'],
      isMetadataEnabled: true,
    });

    expect(screen.getAllByText('gauge').length).toEqual(2);
    expect(screen.getAllByText('my super metric desc').length).toEqual(2);
  });
});
