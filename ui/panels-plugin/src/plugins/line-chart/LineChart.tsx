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

import * as echarts from 'echarts/core';
import type { EChartsOption } from 'echarts';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import { GridComponent, DatasetComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useRunningGraphQueries } from './GraphQueryRunner';

echarts.use([
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
  CanvasRenderer,
]);

export interface LineChartProps {
  width: number;
  height: number;
}

/**
 * Draws a LineChart with Apache ECharts for the current running time series.
 */
function LineChart(props: LineChartProps) {
  const { width, height } = props;
  const queries = useRunningGraphQueries();

  // Calculate the LineChart options based on the query results
  const option: EChartsOption = useMemo(() => {
    const dataset: EChartsOption['dataset'] = [];
    const series: EChartsOption['series'] = [];

    for (const query of queries) {
      // Skip queries that are still loading and don't have data
      if (query.loading || query.data === undefined) continue;

      // For every series that comes back from a query, add a Dataset and a Series
      // to the chart
      for (const dataSeries of query.data.series) {
        const id = dataset.length;

        dataset.push({
          id,
          source: [['timestamp', 'value'], ...dataSeries.values],
        });

        series.push({
          type: 'line',
          datasetId: id,
          name: dataSeries.name,
          symbol: 'none',
        });
      }
    }

    return {
      dataset,
      series,
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
      },
      grid: {
        top: 10,
        right: 10,
        bottom: 0,
        left: 0,
        containLabel: true,
      },
    };
  }, [queries]);

  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<echarts.ECharts | undefined>(undefined);

  // Create a chart instance in the container
  useLayoutEffect(() => {
    if (containerRef === null) return;

    const chart = echarts.init(containerRef);
    setChart(chart);

    return () => {
      chart.dispose();
    };
  }, [containerRef]);

  // Sync options with chart instance
  useLayoutEffect(() => {
    // Can't set options if no chart yet
    if (chart === undefined) return;

    chart.setOption(option);
  }, [chart, option]);

  // Resize the chart to match as width/height changes
  const prevSize = useRef({ width, height });
  useLayoutEffect(() => {
    // No need to resize initially
    if (
      prevSize.current.width === width &&
      prevSize.current.height === height
    ) {
      return;
    }

    // Can't resize if no chart yet
    if (chart === undefined) return;

    chart.resize({ width, height });
    prevSize.current = { width, height };
  }, [chart, width, height]);

  return <Box ref={setContainerRef} sx={{ width, height }}></Box>;
}

export default LineChart;
