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

import React, { useMemo, useRef, useState } from 'react';
import { useDeepMemo } from '@perses-dev/core';
import { Box } from '@mui/material';
// import merge from 'lodash/merge';
import type {
  EChartsCoreOption,
  GridComponentOption,
  LineSeriesOption,
  LegendComponentOption,
  ToolboxComponentOption,
  VisualMapComponentOption,
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
import { EChart, OnEventsType } from './EChart';
import { PROGRESSIVE_MODE_SERIES_LIMIT, EChartsDataFormat } from './model/graph';
import { abbreviateLargeNumber } from './model/units';
import { useChartsTheme } from './context/ChartsThemeProvider';
import { emptyTooltipData } from './tooltip/tooltip-model';
import { Tooltip } from './tooltip/Tooltip';

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

export interface ZoomEventData {
  start: number;
  end: number;
  startIndex: number;
  endIndex: number;
}

interface LineChartProps {
  height: number;
  data: EChartsDataFormat;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  toolbox?: ToolboxComponentOption;
  visualMap?: VisualMapComponentOption[];
  onDataZoom?: (e: ZoomEventData) => void;
}

export function LineChart({ height, data, grid, legend, visualMap, onDataZoom }: LineChartProps) {
  const chartsTheme = useChartsTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  const handleEvents: OnEventsType<LineSeriesOption['data'] | unknown> = useMemo(() => {
    return {
      // TODO (sjcobb): use legendselectchanged event to fix tooltip when legend selected
      datazoom: (params) => {
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
    };
  }, [data, onDataZoom]);

  // TODO (sjcobb): refactor to separate function
  // enable data zoom by default w/o clicking toolbox icon
  if (chartRef.current !== undefined) {
    const chart = chartRef.current;
    const chartModel = chart['_model'];
    if (chartModel !== undefined) {
      // check if hidden data zoom icon is unselected (if selected it would be 'emphasis' instead of 'normal')
      if (chart['_model'].option.toolbox[0].feature.dataZoom.iconStatus.zoom === 'normal') {
        chart.dispatchAction({
          type: 'takeGlobalCursor',
          key: 'dataZoomSelect',
          dataZoomSelectActive: true,
        });
      }
    }
  }

  const handleOnDoubleClick = () => {
    if (chartRef.current !== undefined) {
      const chart = chartRef.current;
      chart.dispatchAction({
        type: 'restore', // https://echarts.apache.org/en/api.html#events.restore
      });
    }
  };

  const handleOnMouseDown = (event: React.MouseEvent) => {
    // hide tooltip when user drags to zoom, but allow clicking inside tooltip to copy labels
    if (event.target instanceof HTMLCanvasElement) {
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
  };

  const option: EChartsCoreOption = useDeepMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null || data.timeSeries.length === 0) return chartsTheme.noDataOption;

    const showPointsOnHover = data.timeSeries.length < PROGRESSIVE_MODE_SERIES_LIMIT;

    const rangeMs = data.rangeMs ?? getDateRange(data.xAxis);

    const option: EChartsCoreOption = {
      grid,
      toolbox: {
        feature: {
          dataZoom: {
            icon: null, // https://stackoverflow.com/a/67684076/17575201
            yAxisIndex: 'none',
          },
        },
      },
      series: data.timeSeries,
      xAxis: {
        type: 'category',
        data: data.xAxis,
        max: data.xAxisMax,
        axisLabel: {
          formatter: (value: number) => {
            return getFormattedDate(value, rangeMs);
          },
        },
      },
      yAxis: {
        type: 'value',
        boundaryGap: [0, '10%'],
        axisLabel: {
          formatter: (value: number) => {
            return abbreviateLargeNumber(value);
          },
        },
      },
      animation: false,
      tooltip: {
        show: showPointsOnHover,
        trigger: 'axis',
        showContent: false,
        axisPointer: {
          type: 'none',
        },
      },
      legend,
      visualMap,
    };

    return option;
  }, [data, grid, legend, visualMap]);

  return (
    <Box
      sx={{
        height,
      }}
      onDoubleClick={handleOnDoubleClick}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
      onMouseLeave={handleOnMouseLeave}
      onMouseEnter={handleOnMouseEnter}
    >
      {showTooltip === true && (
        <Tooltip chartRef={chartRef} tooltipData={emptyTooltipData} chartData={data} wrapLabels={true}></Tooltip>
      )}

      <EChart
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option}
        theme={chartsTheme.themeName}
        onEvents={handleEvents}
        _instance={chartRef}
      />
    </Box>
  );
}

// fallback when xAxis time range not passed as prop
function getDateRange(data: number[]) {
  const defaultRange = 3600000; // hour in ms
  if (data.length === 0) return defaultRange;
  const lastDatum = data[data.length - 1];
  if (data[0] === undefined || lastDatum === undefined) return defaultRange;
  return lastDatum - data[0];
}

// determines time granularity for axis labels, defaults to hh:mm
function getFormattedDate(value: number, rangeMs: number) {
  const dateFormatOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  };
  const thirtyMinMs = 1800000;
  const dayMs = 86400000;
  if (rangeMs <= thirtyMinMs) {
    dateFormatOptions.second = 'numeric';
  } else if (rangeMs >= dayMs) {
    dateFormatOptions.month = 'numeric';
    dateFormatOptions.day = 'numeric';
  }
  const DATE_FORMAT = new Intl.DateTimeFormat(undefined, dateFormatOptions);
  // remove comma when month / day present
  return DATE_FORMAT.format(value).replace(/, /g, ' ');
}
