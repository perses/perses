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

import { BarChart, BarChartData } from '@perses-dev/components';
import { Box, Stack, Skeleton } from '@mui/material';
import { useMemo } from 'react';
import { CalculationsMap } from '@perses-dev/core';
import { useDataQueries, PanelProps } from '@perses-dev/plugin-system';
import { BarChartOptions } from './bar-chart-model';
import { calculatePercentages, sortSeriesData } from './utils';

const PADDING = 24;

export type BarChartPanelProps = PanelProps<BarChartOptions>;

export function BarChartPanel(props: BarChartPanelProps) {
  const {
    spec: { calculation, unit, sort, mode },
    contentDimensions,
  } = props;

  const { queryResults, isLoading, isFetching } = useDataQueries(); // gets data queries from a context provider, see DataQueriesProvider

  const barData: BarChartData[] = useMemo(() => {
    if (queryResults[0]?.data === undefined) {
      return [];
    }
    const seriesData: BarChartData[] = [];
    for (const timeSeries of queryResults[0].data.series) {
      const calculate = CalculationsMap[calculation];
      const series = {
        value: calculate(timeSeries.values) ?? null,
        label: timeSeries.formattedName ?? '',
      };
      seriesData.push(series);
    }
    const sortedSeriesData = sortSeriesData(seriesData, sort);

    if (mode === 'percentage') {
      return calculatePercentages(sortedSeriesData);
    } else {
      return sortedSeriesData;
    }
  }, [queryResults, sort, mode, calculation]);

  if (queryResults[0]?.error) throw queryResults[0]?.error;

  if (contentDimensions === undefined) return null;

  if (isLoading || isFetching) {
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
    <Stack
      height={contentDimensions.height}
      width={contentDimensions.width}
      direction="row"
      justifyContent="center"
      alignItems="center"
    >
      <BarChart
        width={contentDimensions.width - PADDING * 2}
        height={contentDimensions.height - PADDING}
        data={barData}
        unit={unit}
        mode={mode}
      />
    </Stack>
  );
}
