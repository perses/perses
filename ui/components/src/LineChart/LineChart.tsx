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

import { MouseEvent, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import type {
  EChartsCoreOption,
  GridComponentOption,
  LineSeriesOption,
  LegendComponentOption,
  VisualMapComponentOption,
  YAXisComponentOption,
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
  VisualMapComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChart, OnEventsType } from '../EChart';
import { EChartsDataFormat } from '../model/graph';
import { UnitOptions } from '../model/units';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { Tooltip } from '../Tooltip/Tooltip';
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
  VisualMapComponent,
  CanvasRenderer,
]);

interface LineChartProps {
  height: number;
  data: EChartsDataFormat;
  yAxis?: YAXisComponentOption;
  unit?: UnitOptions;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  visualMap?: VisualMapComponentOption[];
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
}

export function LineChart({ height, data, yAxis, unit, grid, legend, onDataZoom, onDoubleClick }: LineChartProps) {
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

  const handleOnClick = () => setPinTooltip((current) => !current);

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

  const handleOnMouseDown = (e: MouseEvent) => {
    // hide tooltip when user drags to zoom, but allow clicking inside tooltip to copy labels
    if (e.target instanceof HTMLCanvasElement) {
      setShowTooltip(false);
    }
  };

  const handleOnMouseUp = () => {
    setShowTooltip(true);
  };

  const handleOnMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleOnMouseLeave = () => {
    setShowTooltip(false);
    setPinTooltip(false);
  };

  const yAxisArr = getYAxes(yAxis, unit);
  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null || data.timeSeries.length === 0) return noDataOption;

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
      yAxis: yAxisArr,
      animation: false,
      tooltip: {
        show: true,
        trigger: 'axis',
        showContent: false, // echarts tooltip content hidden since we use custom tooltip instead
        axisPointer: {
          type: 'line',
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

    return option;
  }, [data, yAxisArr, grid, legend, noDataOption, timeZone]);

  return (
    <Box
      sx={{
        height,
      }}
      onClick={handleOnClick}
      onDoubleClick={handleOnDoubleClick}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
      onMouseLeave={handleOnMouseLeave}
      onMouseEnter={handleOnMouseEnter}
    >
      {showTooltip === true && (
        <Tooltip chartRef={chartRef} chartData={data} wrapLabels={true} pinTooltip={pinTooltip} unit={unit}></Tooltip>
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
