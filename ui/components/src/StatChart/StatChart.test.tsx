import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChartsThemeProvider } from '../context/ChartsThemeProvider';
import { UnitOptions } from '../model';
import { StatChart, StatChartData } from './StatChart';

describe('StatChart', () => {
  const contentDimensions = {
    width: 200,
    height: 200,
  };

  const unit: UnitOptions = {
    kind: 'Decimal',
    decimal_places: 2,
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

  describe('Render default options (no sparkline)', () => {
    it('should render', () => {
      render(
        <ChartsThemeProvider themeName="perses">
          <StatChart
            width={contentDimensions.width}
            height={contentDimensions.height}
            data={mockStatData}
            unit={unit}
          />
        </ChartsThemeProvider>
      );
      expect(screen.getByText('7.73')).toBeInTheDocument();
    });
  });
});
