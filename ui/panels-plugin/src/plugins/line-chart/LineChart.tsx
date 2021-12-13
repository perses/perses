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
import { GridComponent, TooltipComponent, TooltipComponentOption } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useRunningGraphQueries } from './GraphQueryRunner';
import { getCommonTimeScale, getXValues } from './data-transform';

echarts.use([EChartsLineChart, GridComponent, TooltipComponent, CanvasRenderer]);

export interface LineChartProps {
  width: number;
  height: number;
}

type TooltipFormatterCallback = Exclude<NonNullable<TooltipComponentOption['formatter']>, string>;
type TooltipFormatterParams = Parameters<TooltipFormatterCallback>[0];
const tooltipFormatter: TooltipFormatterCallback = (params: TooltipFormatterParams) => {
  if (Array.isArray(params)) {
    const tooltipData = params[0] ?? { data: 'Tooltip data empty' };
    return tooltipData.data.toString();
  }
  const seriesName = params.seriesName ?? '';
  const formattedNames = seriesName.split(',').join('<br />');
  const formattedTime = echarts.format.formatTime('yyyy-MM-dd hh:mm:ss', Number(params.name));
  const customMarker = `<span style="float:left; width:9px; height:9px; margin:5px 6px 0 0; background-color:${params.color};"></span>`;
  return `
    <h4 style="margin: 2px 0 3px;">${formattedTime}</h4>
    <div>${customMarker}<span>value: ${params.value}</span></div>
    <div style="margin-bottom:4px; font-size:10px; font-weight:300;">${formattedNames}</div>
  `;
};

/**
 * Draws a LineChart with Apache ECharts for the current running time series.
 */
function LineChart(props: LineChartProps) {
  const { width, height } = props;
  const queries = useRunningGraphQueries();

  // Calculate the LineChart options based on the query results
  const option: EChartsOption = useMemo(() => {
    const timeScale = getCommonTimeScale(queries);
    if (timeScale === undefined) {
      return { data: undefined, options: undefined };
    }

    const series: EChartsOption['series'] = [];
    const xAxisData = [...getXValues(timeScale)];

    for (const query of queries) {
      // Skip queries that are still loading and don't have data
      if (query.loading || query.data === undefined) continue;

      for (const timeSeries of query.data.series) {
        const yValues: number[] = [];
        for (const valueTuple of timeSeries.values) {
          yValues.push(valueTuple[1]);
        }
        series.push({
          type: 'line',
          name: timeSeries.name,
          data: yValues,
          sampling: 'lttb', // use Largest-Triangle-Three-Bucket algorithm to filter points
          progressiveThreshold: 1,
          symbol: 'rect',
          // connectNulls: true,
        });
      }
    }

    return {
      title: {
        show: false,
      },
      series,
      xAxis: {
        type: 'category',
        data: xAxisData,
        boundaryGap: false,
        axisLabel: {
          formatter: (label: string) => {
            // TODO (sjcobb): adjust format for different intervals
            const formattedTime = echarts.format.formatTime('hh-mm', Number(label));
            return formattedTime;
          },
        },
      },
      yAxis: {
        type: 'value',
      },
      grid: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 0,
        containLabel: true,
      },
      animation: false,
      // TODO (sjcobb): move shared tooltip styles to chart theme
      tooltip: {
        show: true,
        trigger: 'item',
        enterable: false,
        confine: true,
        extraCssText: 'max-height: 220px; max-width: 350px; overflow: auto;',
        showDelay: 0,
        hideDelay: 100,
        transitionDuration: 0.2,
        backgroundColor: '#333',
        borderColor: '#333',
        borderRadius: 2,
        borderWidth: 0,
        padding: [6, 12],
        textStyle: {
          color: '#fff',
          fontFamily: '"Lato", sans-serif',
          fontSize: 11,
          fontWeight: 400,
        },
        formatter: tooltipFormatter,
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

    if (option.series === undefined) {
      chart.showLoading();
    } else {
      chart.hideLoading();
    }

    chart.setOption(option);
  }, [chart, option]);

  // Resize the chart to match as width/height changes
  const prevSize = useRef({ width, height });
  useLayoutEffect(() => {
    // No need to resize initially
    if (prevSize.current.width === width && prevSize.current.height === height) {
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
