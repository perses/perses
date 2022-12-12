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

import { render, screen } from '@testing-library/react';
import { ChartsThemeProvider } from '../context/ChartsThemeProvider';
import { UnitOptions } from '../model';
import { testChartsTheme } from '../test-utils';
import { StatChart, StatChartData } from './StatChart';

describe('StatChart', () => {
  const renderChart = (unit: UnitOptions) => {
    const contentDimensions = {
      width: 200,
      height: 200,
    };
    render(
      <ChartsThemeProvider chartsTheme={testChartsTheme}>
        <StatChart width={contentDimensions.width} height={contentDimensions.height} data={mockStatData} unit={unit} />
      </ChartsThemeProvider>
    );
  };

  const mockStatData: StatChartData = {
    calculatedValue: 7.72931659687181,
    name: 'Example Stat Chart',
    seriesData: {
      name: '(((count(count(node_cpu_seconds_total{job="example"}) by (cpu))',
      values: [
        [1654006170000, 7.736401673473903],
        [1654006185000, 7.733891213538757],
        [1654006200000, 7.731101813010433],
        [1654006215000, 7.722454672079215],
        [1654006230000, 7.722733612256738],
      ],
    },
  };

  it('render default options (no sparkline)', () => {
    const unit: UnitOptions = {
      kind: 'Decimal',
      decimal_places: 2,
    };
    renderChart(unit);
    expect(screen.getByText('7.73')).toBeInTheDocument();
  });

  it('show value with bytes unit formatting', () => {
    const unit: UnitOptions = {
      kind: 'Bytes',
    };
    renderChart(unit);
    expect(screen.getByText('7.73 bytes')).toBeInTheDocument();
  });

  it('show value with seconds time unit formatting', () => {
    const unit: UnitOptions = {
      kind: 'Seconds',
    };
    renderChart(unit);
    expect(screen.getByText('7.73 seconds')).toBeInTheDocument();
  });

  it('show value with months time unit formatting', () => {
    const unit: UnitOptions = {
      kind: 'Months',
    };
    renderChart(unit);
    expect(screen.getByText('7.73 months')).toBeInTheDocument();
  });
});
