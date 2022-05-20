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

import { useMemo } from 'react';
import { GridComponentOption, ToolboxComponentOption } from 'echarts';
import { Box, Skeleton } from '@mui/material';
import { LineChart, EChartsDataFormat, EChartsValues } from '@perses-dev/components';
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
 * Passes query data and customization options to LineChart
 */
export function LineChartContainer(props: LineChartContainerProps) {
  const { width, height } = props;
  const queries = useRunningGraphQueries();

  // populate series data based on query results
  const { graphData, loading } = useMemo(() => {
    const timeScale = getCommonTimeScale(queries);
    if (timeScale === undefined) {
      return {
        graphData: EMPTY_GRAPH_DATA,
        loading: true,
      };
    }

    const graphData: EChartsDataFormat = { timeSeries: [], xAxis: [], rangeMs: timeScale.endMs - timeScale.startMs };
    const xAxisData = [...getXValues(timeScale)];

    let queriesFinished = 0;
    for (const query of queries) {
      // Skip queries that are still loading and don't have data
      if (query.loading || query.data === undefined) continue;

      for (const dataSeries of query.data.series) {
        const yValues: EChartsValues[] = [];
        for (const valueTuple of dataSeries.values) {
          yValues.push(valueTuple[1]);
        }
        graphData.timeSeries.push({
          type: 'line',
          name: dataSeries.name,
          color: getRandomColor(dataSeries.name),
          data: yValues,
          showSymbol: false,
          symbol: 'circle',
          sampling: 'lttb', // use Largest-Triangle-Three-Bucket algorithm to filter points
          progressiveThreshold: OPTIMIZED_MODE_SERIES_LIMIT,
          lineStyle: {
            width: 1.5,
          },
          emphasis: {
            lineStyle: {
              width: 2,
            },
          },
        });
      }
      queriesFinished++;
    }
    graphData.xAxis = xAxisData;
    return {
      graphData,
      loading: queriesFinished === 0,
      allQueriesLoaded: queriesFinished === queries.length,
    };
  }, [queries]);

  if (loading === true) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} width={width} height={height}>
        <Skeleton variant="text" width={width - 20} height={height / 2} />
      </Box>
    );
  }

  // TODO: toolbox functionality (ex. zoom, undo icons) will move to chart header
  const toolboxOverrides: ToolboxComponentOption = {
    orient: 'vertical',
    top: 0,
    right: 0,
  };

  const gridOverrides: GridComponentOption = {
    right: 40,
  };

  // enables zoom on drag without clicking 'Zoom' icon first
  const dataZoomEnabled = false;

  return (
    <LineChart
      height={height}
      data={graphData}
      grid={gridOverrides}
      toolbox={toolboxOverrides}
      dataZoomEnabled={dataZoomEnabled}
    />
  );
}
