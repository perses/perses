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

import { BarChart, BarChartData, useChartsTheme } from '@perses-dev/components';
import { Box } from '@mui/material';
import { ReactElement, useMemo } from 'react';
import { CalculationType, CalculationsMap, TimeSeriesData } from '@perses-dev/core';
import { PanelProps } from '@perses-dev/plugin-system';
import { BarChartOptions } from './bar-chart-model';
import { calculatePercentages, sortSeriesData } from './utils';

export type BarChartPanelProps = PanelProps<BarChartOptions, TimeSeriesData>;

export function BarChartPanel(props: BarChartPanelProps): ReactElement | null {
  const {
    spec: { calculation, format, sort, mode },
    contentDimensions,
    queryResults,
  } = props;

  const chartsTheme = useChartsTheme();
  const PADDING = chartsTheme.container.padding.default;

  const barChartData: BarChartData[] = useMemo(() => {
    const calculate = CalculationsMap[calculation as CalculationType];
    const barChartData: BarChartData[] = [];
    for (const result of queryResults) {
      for (const seriesData of result.data.series) {
        const series = {
          value: calculate(seriesData.values) ?? null,
          label: seriesData.formattedName ?? '',
        };
        barChartData.push(series);
      }
    }

    const sortedBarChartData = sortSeriesData(barChartData, sort);
    if (mode === 'percentage') {
      return calculatePercentages(sortedBarChartData);
    } else {
      return sortedBarChartData;
    }
  }, [queryResults, sort, mode, calculation]);

  if (contentDimensions === undefined) return null;

  return (
    <Box sx={{ padding: `${PADDING}px` }}>
      <BarChart
        width={contentDimensions.width - PADDING * 2}
        height={contentDimensions.height - PADDING * 2}
        data={barChartData}
        format={format}
        mode={mode}
      />
    </Box>
  );
}
