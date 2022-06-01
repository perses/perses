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
import { getLineSeries, getCommonTimeScale, getYValues, getXValues } from './utils/data-transform';

// export const OPTIMIZED_MODE_SERIES_LIMIT = 500;

export const EMPTY_GRAPH_DATA = {
  timeSeries: [],
  xAxis: [],
};

export interface LineChartContainerProps {
  width: number;
  height: number;
  show_legend?: boolean;
}

/**
 * Passes query data and customization options to LineChart
 */
export function LineChartContainer(props: LineChartContainerProps) {
  const { width, height, show_legend } = props;
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
        // TODO (sjcobb): call getYValues from data-transform.ts to fill in missing values as null
        const yValues: EChartsValues[] = [];
        for (const valueTuple of dataSeries.values) {
          yValues.push(valueTuple[1]);
        }

        // TODO (sjcobb): call getLineSeries with optional threshold
        graphData.timeSeries.push({
          type: 'line',
          name: dataSeries.name,
          color: getRandomColor(dataSeries.name),
          data: yValues,
          sampling: 'lttb', // use Largest-Triangle-Three-Bucket algorithm to filter points
          // progressiveThreshold: OPTIMIZED_MODE_SERIES_LIMIT,
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
    show: true,
    orient: 'vertical',
    top: 0,
    right: 0,
    feature: {
      dataZoom: {
        show: true,
        yAxisIndex: 'none',
      },
      restore: {
        show: true,
      },
    },
  };

  const legendOverrides = {
    show: show_legend === true,
    type: 'scroll',
    bottom: 0,
  };

  const gridOverrides: GridComponentOption = {
    bottom: show_legend === true ? 35 : 0,
  };

  return (
    <LineChart
      height={height}
      data={graphData}
      legend={legendOverrides}
      grid={gridOverrides}
      toolbox={toolboxOverrides}
    />
  );
}
