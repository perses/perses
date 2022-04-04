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

import React, { useMemo, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import merge from 'lodash/merge';
import type {
  EChartsOption,
  LegendComponentOption,
  LineSeriesOption,
  ToolboxComponentOption,
  DataZoomComponentOption,
  VisualMapComponentOption,
} from 'echarts';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
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
import { ECharts, onEventsType } from './ECharts';
import { ECHARTS_OPTIMIZED_MODE_SERIES_LIMIT, EChartsDataFormat, abbreviateLargeNumber } from './model/graph-model';
import { emptyTooltipData } from './tooltip/tooltip-model';
import { Tooltip } from './tooltip/Tooltip';

use([
  LineChart,
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

const noDataOption = {
  title: {
    show: true,
    textStyle: {
      color: 'grey',
      fontSize: 16,
      fontWeight: 400,
    },
    text: 'No data',
    left: 'center',
    top: 'center',
  },
  xAxis: {
    show: false,
  },
  yAxis: {
    show: false,
  },
  series: [],
};

export interface ZoomEventData {
  start: number;
  end: number;
  startIndex: number;
  endIndex: number;
}

interface EChartsLineChartProps {
  height: number;
  data: EChartsDataFormat;
  legend?: LegendComponentOption;
  toolbox?: ToolboxComponentOption;
  dataZoom?: DataZoomComponentOption[];
  visualMap?: VisualMapComponentOption[];
  onDataZoom?: (e: ZoomEventData) => void;
}

export function EChartsLineChart(props: EChartsLineChartProps) {
  const { height, data, legend, toolbox, dataZoom, onDataZoom } = props;
  const theme = useTheme();
  const chartRef = useRef();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  const handleEvents: onEventsType<LineSeriesOption['data']> = useMemo(() => {
    return {
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
      datazoom: (params: any) => {
        if (onDataZoom === undefined) return;
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

  const handleOnMouseDown = (event: React.MouseEvent) => {
    // hide tooltip when user drags to zoom
    // but allow clicking inside tooltip to copy labels
    if (event.target instanceof HTMLCanvasElement) {
      setShowTooltip(false);
    }
  };

  const handleOnMouseUp = () => {
    setShowTooltip(true);
  };

  const option: EChartsOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null) return noDataOption;

    const defaultToolbox = {
      show: true,
      top: 10,
      right: 10,
      iconStyle: {
        borderColor: theme.palette.text.primary,
      },
      feature: {
        dataZoom: {
          show: true,
          yAxisIndex: 'none',
        },
        restore: {
          show: true,
        },
      },
      emphasis: {
        iconStyle: {
          textFill: theme.palette.text.primary,
        },
      },
    };

    const mergedToolbox = merge(defaultToolbox, toolbox);

    // const gridBottom = Array.isArray(dataZoom) && dataZoom[0].type === 'slider' ? 60 : 0;
    const gridBottom = 0;

    const showPointsOnHover = data.timeSeries.length < ECHARTS_OPTIMIZED_MODE_SERIES_LIMIT;

    const option = {
      title: {
        show: false,
      },
      grid: {
        show: true,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.background.paper,
        borderColor: theme.palette.grey['300'],
        top: 55,
        right: 20,
        bottom: gridBottom,
        left: 20,
        containLabel: true,
      },
      series: data.timeSeries,
      xAxis: {
        type: 'category',
        data: data.xAxis,
        axisLabel: {
          color: theme.palette.text.primary,
          margin: 12,
          formatter: (value: number) => {
            return getFormattedDate(value);
          },
        },
        axisTick: {
          show: true,
          length: 6,
        },
        axisLine: {
          lineStyle: {
            color: theme.palette.grey['600'],
          },
        },
      },
      yAxis: {
        type: 'value',
        boundaryGap: ['5%', '10%'],
        axisLabel: {
          showMinLabel: false,
          showMaxLabel: true,
          color: theme.palette.text.primary,
          formatter: (value: number) => {
            return abbreviateLargeNumber(value);
          },
        },
        splitLine: {
          lineStyle: {
            color: theme.palette.grey['300'],
          },
        },
      },
      animation: false,
      legend,
      toolbox: mergedToolbox,
      tooltip: {
        show: showPointsOnHover,
        trigger: 'axis',
        showContent: false,
        axisPointer: {
          type: 'none',
        },
      },
      dataZoom,
    };

    return option;
  }, [data, theme, legend, toolbox, dataZoom]);

  return (
    <Box
      sx={{
        height,
      }}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
    >
      {showTooltip === true && (
        <Tooltip chartRef={chartRef} tooltipData={emptyTooltipData} chartData={data} wrapLabels={true}></Tooltip>
      )}

      <ECharts
        sx={{
          width: '100%',
          height: '100%',
        }}
        option={option}
        onEvents={handleEvents}
        _instance={chartRef}
      />
    </Box>
  );
}

function getFormattedDate(value: number) {
  const XAXIS_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  return XAXIS_DATE_FORMAT.format(value * 1000);
}
