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

import { TimeSeriesData } from '@perses-dev/core';
import { TimeSeriesTableProps } from '@perses-dev/panels-plugin';
import { render, screen } from '@testing-library/react';
import { ChartsProvider, SnackbarProvider, testChartsTheme } from '@perses-dev/components';
import {
  MOCK_TIME_SERIES_DATA_MULTIVALUE,
  MOCK_TIME_SERIES_DATA_SINGLEVALUE,
  MOCK_TIME_SERIES_QUERY_DEFINITION,
} from '../../test';
import { TimeSeriesTablePanel } from './TimeSeriesTablePanel';

const TEST_TIME_SERIES_TABLE_PROPS: Omit<TimeSeriesTableProps, 'queryResults'> = {
  contentDimensions: {
    width: 500,
    height: 500,
  },
  spec: {},
};

describe('TimeSeriesTablePanel', () => {
  // Helper to render the panel with some context set
  const renderPanel = (data: TimeSeriesData): void => {
    render(
      <SnackbarProvider>
        <ChartsProvider chartsTheme={testChartsTheme}>
          <TimeSeriesTablePanel
            {...TEST_TIME_SERIES_TABLE_PROPS}
            queryResults={[{ definition: MOCK_TIME_SERIES_QUERY_DEFINITION, data }]}
          />
        </ChartsProvider>
      </SnackbarProvider>
    );
  };

  it('should render multi values with timestamps', async () => {
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
