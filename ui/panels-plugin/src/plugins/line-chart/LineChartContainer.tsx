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
import { GridComponentOption } from 'echarts';
import { Box, Skeleton } from '@mui/material';
import { LineChart, EChartsDataFormat } from '@perses-dev/components';
import { StepOptions, ThresholdOptions } from '../../model/thresholds';
import { useRunningGraphQueries } from './GraphQueryRunner';
import { getLineSeries, getCommonTimeScale, getYValues, getXValues } from './utils/data-transform';

export const EMPTY_GRAPH_DATA = {
  timeSeries: [],
  xAxis: [],
};

export interface LineChartContainerProps {
  width: number;
  height: number;
  show_legend?: boolean;
  thresholds?: ThresholdOptions;
}

/**
 * Passes query data and customization options to LineChart
 */
export function LineChartContainer(props: LineChartContainerProps) {
  const { width, height, show_legend, thresholds } = props;
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

      for (const timeSeries of query.data.series) {
        const yValues = getYValues(timeSeries, timeScale);
        const lineSeries = getLineSeries(timeSeries.name, yValues);
        graphData.timeSeries.push(lineSeries);
      }
      queriesFinished++;
    }
    graphData.xAxis = xAxisData;

    if (thresholds !== undefined && thresholds.steps !== undefined) {
      thresholds.steps.forEach((step: StepOptions) => {
        // TODO (sjcobb): set color defaults similar to GaugeChartPanel
        const stepOption: StepOptions = {
          color: 'red',
          value: step.value,
        };
        const conditionLineData = Array(xAxisData.length).fill(step.value);
        const conditionLineSeries = getLineSeries('', conditionLineData, stepOption);
        graphData.timeSeries.push(conditionLineSeries);
      });
    }

    return {
      graphData,
      loading: queriesFinished === 0,
      allQueriesLoaded: queriesFinished === queries.length,
    };
  }, [queries, thresholds]);

  if (loading === true) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} width={width} height={height}>
        <Skeleton variant="text" width={width - 20} height={height / 2} />
      </Box>
    );
  }

  const legendOverrides = {
    show: show_legend === true,
    type: 'scroll',
    bottom: 0,
  };

  const gridOverrides: GridComponentOption = {
    bottom: show_legend === true ? 35 : 0,
  };

  return <LineChart height={height} data={graphData} legend={legendOverrides} grid={gridOverrides} />;
}
