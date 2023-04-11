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
import { Box, Skeleton } from '@mui/material';
import { useMemo } from 'react';
import { TimeSeriesData } from '@perses-dev/core';
import { useTimeSeriesQuery, PanelProps, CalculationsMap, CalculationType } from '@perses-dev/plugin-system';
import { useSuggestedStepMs } from '../../model/time';
import { StatChartOptions } from './stat-chart-model';
import { convertSparkline, getColorFromThresholds } from './utils/data-transform';

export type StatChartPanelProps = PanelProps<StatChartOptions>;

export function StatChartPanel(props: StatChartPanelProps) {
  const {
    spec: { query, calculation, unit, sparkline, thresholds },
    contentDimensions,
  } = props;
  const suggestedStepMs = useSuggestedStepMs(contentDimensions?.width);
  const { data, isLoading, error } = useTimeSeriesQuery(query, { suggestedStepMs });
  const chartData = useChartData(data, calculation);
  const chartsTheme = useChartsTheme();

  if (error) throw error;

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

  return (
    <StatChart
      width={contentDimensions.width}
      height={contentDimensions.height}
      data={chartData}
      unit={unit}
      color={getColorFromThresholds(chartsTheme, thresholds, chartData.calculatedValue)}
      sparkline={convertSparkline(chartsTheme, sparkline, thresholds, chartData.calculatedValue)}
    />
  );
}

const useChartData = (data: TimeSeriesData | undefined, calculation: CalculationType): StatChartData => {
  return useMemo(() => {
    const loadingData = {
      calculatedValue: undefined,
      seriesData: undefined,
    };
    if (data === undefined) return loadingData;

    const seriesData = data.series[0];
    const calculate = CalculationsMap[calculation];
    const calculatedValue = seriesData !== undefined ? calculate(seriesData.values) : undefined;

    return { calculatedValue, seriesData };
  }, [data, calculation]);
};
