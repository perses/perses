// Copyright 2021 The Perses Authors
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

import type { EChartsOption } from 'echarts';
import { useMemo } from 'react';
import { Box } from '@mui/material';
import { LineChart, EChartsDataFormat } from '@perses-dev/components';
import { useRunningGraphQueries } from './GraphQueryRunner';
import { getRandomColor } from './utils/palette-gen';
import { getCommonTimeScale, getXValues } from './utils/data-transform';

export const OPTIMIZED_MODE_SERIES_LIMIT = 500;

export const EMPTY_GRAPH_DATA = {
  timeSeries: [],
  xAxis: [],
};

export interface LineChartContainerProps {
  width: number;
  height: number;
}

/**
 * Draws a LineChart with Apache ECharts for the current running time series.
 */
export function LineChartContainer(props: LineChartContainerProps) {
  const { width, height } = props;
  const queries = useRunningGraphQueries();

  // populate series data based on query results
  const graphData: EChartsDataFormat = useMemo(() => {
    const timeScale = getCommonTimeScale(queries);
    if (timeScale === undefined) return EMPTY_GRAPH_DATA;

    const series: EChartsOption['series'] = [];
    const xAxisData = [...getXValues(timeScale)];

    for (const query of queries) {
      // Skip queries that are still loading and don't have data
      if (query.loading || query.data === undefined) continue;

      for (const dataSeries of query.data.series) {
        series.push({
          type: 'line',
          name: dataSeries.name,
          color: getRandomColor(dataSeries.name),
          data: [...dataSeries.values],
          showSymbol: false,
          symbol: 'circle',
          sampling: 'lttb', // use Largest-Triangle-Three-Bucket algorithm to filter points
          progressiveThreshold: OPTIMIZED_MODE_SERIES_LIMIT,
        });
      }
    }

    if (series.length === 0) return EMPTY_GRAPH_DATA;

    return EMPTY_GRAPH_DATA;
    // return {
    //   timeSeries: series,
    //   xAxis: xAxisData,
    // };
  }, [queries]);

  // const graphData: EChartsDataFormat = { timeSeries: [], xAxis: [] };
  // const graphData = { timeSeries: [], xAxis: [] };

  return (
    <Box sx={{ width, height }}>
      <LineChart height={height} data={graphData} />
    </Box>
  );
}
