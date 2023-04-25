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

import { StatChart, StatChartData, useChartsTheme } from '@perses-dev/components';
import { Box, Skeleton, Stack } from '@mui/material';
import { useMemo } from 'react';
import { CalculationType, CalculationsMap } from '@perses-dev/core';
import { useDataQueries, UseDataQueryResults, PanelProps } from '@perses-dev/plugin-system';
// import { TimeSeriesQueryDefinition } from '@perses-dev/core';
import { StatChartOptions } from './stat-chart-model';
import { convertSparkline, getColorFromThresholds } from './utils/data-transform';
// import { TimeSeriesChartOptionsEditorSettings } from '../time-series-chart/TimeSeriesChartOptionsEditorSettings';

const MIN_WIDTH = 150;
const PANEL_PADDING_OFFSET = 0;

export type StatChartPanelProps = PanelProps<StatChartOptions>;

export function StatChartPanel(props: StatChartPanelProps) {
  const {
    spec: { calculation, unit, sparkline, thresholds },
    contentDimensions,
  } = props;

  const { queryResults, isLoading } = useDataQueries();
  const statChartData = useStatChartData(queryResults, calculation);
  const chartsTheme = useChartsTheme();

  if (queryResults[0]?.error) throw queryResults[0]?.error;

  if (contentDimensions === undefined) return null;

  if (isLoading === true) {
    return (
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        width={contentDimensions.width}
        height={contentDimensions.height}
      >
        <Skeleton variant="text" width={contentDimensions.width - 20} height={contentDimensions.height / 2} />
      </Box>
    );
  }

  // accounts for showing a separate chart for each time series
  let chartWidth = contentDimensions.width / statChartData.length - PANEL_PADDING_OFFSET;
  if (chartWidth < MIN_WIDTH && statChartData.length > 1) {
    // enables horizontal scroll when charts overflow outside of panel
    chartWidth = MIN_WIDTH;
  }

  return (
    <Stack
      direction="row"
      height="100%"
      spacing={0.5}
      justifyContent={statChartData.length > 1 ? 'left' : 'center'}
      alignItems="center"
      sx={{
        // so scrollbar only shows when necessary
        overflowX: statChartData.length > 1 ? 'scroll' : 'auto',
      }}
    >
      {statChartData.map((series, index) => (
        <StatChart
          key={index}
          width={chartWidth}
          height={contentDimensions.height}
          data={series}
          unit={unit}
          color={getColorFromThresholds(chartsTheme, thresholds, series.calculatedValue)}
          sparkline={convertSparkline(chartsTheme, sparkline, thresholds, series.calculatedValue)}
        />
      ))}
    </Stack>
  );
}

const useStatChartData = (
  queryResults: UseDataQueryResults['queryResults'],
  calculation: CalculationType
): StatChartData[] => {
  return useMemo(() => {
    const calculate = CalculationsMap[calculation];
    const chartData: StatChartData[] = [];
    for (const result of queryResults) {
      // Skip queries that are still loading or don't have data
      if (result.isLoading || result.isFetching || result.data === undefined) continue;

      for (const seriesData of result.data.series) {
        const calculatedValue = seriesData !== undefined ? calculate(seriesData.values) : undefined;
        chartData.push({ calculatedValue, seriesData });
      }
    }
    return chartData;
  }, [queryResults, calculation]);
};
