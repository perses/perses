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
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { useRunningGraphQueries } from './GraphQueryRunner';
import { TooltipData, emptyTooltipData } from './tooltip/tooltip-model';
import { getRandomColor } from './utils/palette-gen';
import { getCommonTimeScale } from './utils/data-transform';
import { getNearbySeries } from './utils/focused-series';
import Tooltip from './tooltip/Tooltip';

echarts.use([EChartsLineChart, GridComponent, TooltipComponent, CanvasRenderer]);

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
  const [tooltipData, setTooltipData] = useState<TooltipData>(emptyTooltipData);

  // Calculate the LineChart options based on the query results
  const { option, timeScale } = useMemo(() => {
    const timeScale = getCommonTimeScale(queries);
    if (timeScale === undefined) {
      return { option: { series: undefined }, timeScale: undefined };
    }

    const series: EChartsOption['series'] = [];

    for (const query of queries) {
      // Skip queries that are still loading and don't have data
      if (query.loading || query.data === undefined) continue;

      for (const dataSeries of query.data.series) {
        series.push({
          type: 'line',
          name: dataSeries.name,
          data: [...dataSeries.values],
          color: getRandomColor(dataSeries.name),
          symbol: 'none',
          showSymbol: false,
          lineStyle: { width: 1.5 },
          emphasis: { lineStyle: { width: 2 } },
          sampling: 'lttb', // use Largest-Triangle-Three-Bucket algorithm to filter points
          progressiveThreshold: 1,
        });
      }
    }

    const option: EChartsOption = {
      title: {
        show: false,
      },
      series,
      xAxis: {
        type: 'time',
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisPointer: {
          show: false,
          triggerTooltip: false,
        },
      },
      grid: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 0,
        containLabel: true,
      },
      animation: false,
      tooltip: {
        show: false,
      },
    };

    return {
      option,
      timeScale,
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
    if (chart === undefined) return;

    if (option.series === undefined) {
      chart.showLoading();
    } else {
      chart.hideLoading();
    }

    chart.setOption(option);
  }, [chart, option]);

  // Populate tooltip data from getZr cursor coordinates
  useMemo(() => {
    if (chart === undefined) return;

    const chartWidth = chart.getWidth();
    let lastPosX = -1;
    let lastPosY = -1;
    chart.getZr().on('mousemove', (params) => {
      const pointInPixel = [params.offsetX, params.offsetY];
      const mouseEvent = params.event as MouseEvent;

      // only trigger tooltip when within chart canvas
      if (!chart.containPixel('grid', pointInPixel)) {
        setTooltipData(emptyTooltipData); // resets tooltip content
        return;
      }

      // only trigger when cursor has moved
      if (lastPosX !== params.offsetX || lastPosY !== params.offsetY) {
        const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
        if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
          const stepInterval = timeScale ? timeScale.stepMs : 0;
          setTooltipData({
            cursor: {
              coords: {
                plotCanvas: {
                  x: params.offsetX,
                  y: params.offsetY,
                },
                viewport: {
                  x: mouseEvent.pageX,
                  y: mouseEvent.pageY,
                },
              },
              chartWidth: chartWidth,
              focusedSeriesIdx: null,
              focusedPointIdx: null,
            },
            focusedSeries: getNearbySeries(option.series, pointInGrid, stepInterval),
          });
        }
      }
      lastPosX = params.offsetX;
      lastPosY = params.offsetY;
    });
  }, [chart, option, timeScale]);

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

  return (
    <>
      <Box ref={setContainerRef} sx={{ width, height }}></Box>
      <Tooltip tooltipData={tooltipData}></Tooltip>
    </>
  );
}

export default LineChart;
