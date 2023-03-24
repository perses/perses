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

import React, { MouseEvent, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type {
  EChartsCoreOption,
  GridComponentOption,
  LineSeriesOption,
  LegendComponentOption,
  YAXisComponentOption,
  TooltipComponentOption,
} from 'echarts';
import { ECharts as EChartsInstance, use } from 'echarts/core';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import {
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChart, OnEventsType } from '../EChart';
import { EChartsDataFormat, OPTIMIZED_MODE_SERIES_LIMIT } from '../model/graph';
import { UnitOptions } from '../model/units';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { TimeSeriesTooltip } from '../TimeSeriesTooltip';
import { useTimeZone } from '../context/TimeZoneProvider';
import { enableDataZoom, getDateRange, getFormattedDate, getYAxes, restoreChart, ZoomEventData } from './utils';

use([
  EChartsLineChart,
  GridComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

export interface LineChartProps {
  /**
   * Height of the chart
   */
  height: number;
  data: EChartsDataFormat;
  yAxis?: YAXisComponentOption;
  unit?: UnitOptions;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  __experimentalEChartsOptionsOverride?: (options: EChartsCoreOption) => EChartsCoreOption;
}

export function LineChart({
  height,
  data,
  yAxis,
  unit,
  grid,
  legend,
  onDataZoom,
  onDoubleClick,
  __experimentalEChartsOptionsOverride,
}: LineChartProps) {
  const chartsTheme = useChartsTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [pinTooltip, setPinTooltip] = useState<boolean>(false);
  const { timeZone } = useTimeZone();

  const handleEvents: OnEventsType<LineSeriesOption['data'] | unknown> = useMemo(() => {
    return {
      datazoom: (params) => {
        if (onDataZoom === undefined) {
          setTimeout(() => {
            // workaround so unpin happens after click event
            setPinTooltip(false);
          }, 10);
        }
        if (onDataZoom === undefined || params.batch[0] === undefined) return;
        const startIndex = params.batch[0].startValue ?? 0;
        const endIndex = params.batch[0].endValue ?? data.xAxis.length - 1;
        const xAxisStartValue = data.xAxis[startIndex];
        const xAxisEndValue = data.xAxis[endIndex];

        if (xAxisStartValue !== undefined && xAxisEndValue !== undefined) {
          const zoomEvent: ZoomEventData = {
            start: xAxisStartValue,
            end: xAxisEndValue,
            startIndex,
            endIndex,
          };
          onDataZoom(zoomEvent);
        }
      },
      // TODO: use legendselectchanged event to fix tooltip when legend selected
    };
  }, [data, onDataZoom, setPinTooltip]);

  if (chartRef.current !== undefined) {
    enableDataZoom(chartRef.current);
  }

  const handleOnDoubleClick = (e: MouseEvent) => {
    setPinTooltip(false);
    // either dispatch ECharts restore action to return to orig state or allow consumer to define behavior
    if (onDoubleClick === undefined) {
      if (chartRef.current !== undefined) {
        restoreChart(chartRef.current);
      }
    } else {
      onDoubleClick(e);
    }
  };

  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null || data.timeSeries.length === 0) return noDataOption;

    // show symbols and axisPointer dashed line on hover
    const isOptimizedMode = data.timeSeries.length > OPTIMIZED_MODE_SERIES_LIMIT;

    const rangeMs = data.rangeMs ?? getDateRange(data.xAxis);

    const option: EChartsCoreOption = {
      series: data.timeSeries,
      xAxis: {
        type: 'category',
        data: data.xAxis,
        max: data.xAxisMax,
        axisLabel: {
          formatter: (value: number) => {
            return getFormattedDate(value, rangeMs, timeZone);
          },
        },
      },
      yAxis: getYAxes(yAxis, unit),
      animation: false,
      tooltip: {
        show: !isOptimizedMode,
        trigger: 'axis',
        showContent: false, // echarts tooltip content hidden since we use custom tooltip instead
        axisPointer: {
          type: isOptimizedMode ? 'none' : 'line',
          z: 0, // ensure point symbol shows on top of dashed line
        },
      },
      toolbox: {
        feature: {
          dataZoom: {
            icon: null, // https://stackoverflow.com/a/67684076/17575201
            yAxisIndex: 'none',
          },
        },
      },
      grid,
      legend,
    };

    if (__experimentalEChartsOptionsOverride) {
      return __experimentalEChartsOptionsOverride(option);
    }
    return option;
  }, [data, yAxis, unit, grid, legend, noDataOption, timeZone, __experimentalEChartsOptionsOverride]);

  return (
    <Box
      sx={{ height }}
      onClick={() => {
        setPinTooltip((current) => !current);
      }}
      onMouseDown={(e) => {
        // hide tooltip when user drags to zoom, but allow clicking inside tooltip to copy labels
        if (e.target instanceof HTMLCanvasElement) {
          setShowTooltip(false);
        }
      }}
      onMouseUp={() => {
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        setShowTooltip(false);
        setPinTooltip(false);
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        if (chartRef.current !== undefined) {
          enableDataZoom(chartRef.current);
        }
      }}
      onDoubleClick={handleOnDoubleClick}
    >
      {showTooltip === true && (option.tooltip as TooltipComponentOption).showContent === false && (
        <TimeSeriesTooltip chartRef={chartRef} chartData={data} wrapLabels={true} pinTooltip={pinTooltip} unit={unit} />
      )}

      <EChart
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option}
        theme={chartsTheme.echartsTheme}
        onEvents={handleEvents}
        _instance={chartRef}
      />
    </Box>
  );
}
