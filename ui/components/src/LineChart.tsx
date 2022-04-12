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
  GridComponentOption,
  LegendComponentOption,
  LineSeriesOption,
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
import { ECharts, OnEventsType } from './ECharts';
import { PROGRESSIVE_MODE_SERIES_LIMIT, EChartsDataFormat } from './model/graph-model';
import { abbreviateLargeNumber } from './model/units';
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

interface LineChartProps {
  height: number;
  data: EChartsDataFormat;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  toolbox?: ToolboxComponentOption;
  visualMap?: VisualMapComponentOption[];
  dataZoomEnabled?: boolean;
  onDataZoom?: (e: ZoomEventData) => void;
}

export function LineChart(props: LineChartProps) {
  const { height, data, grid, legend, toolbox, dataZoomEnabled, onDataZoom } = props;
  const theme = useTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  const handleEvents: OnEventsType<LineSeriesOption['data']> = useMemo(() => {
    return {
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

  if (chartRef.current !== undefined && dataZoomEnabled === true) {
    const chart = chartRef.current;
    chart.dispatchAction({
      type: 'takeGlobalCursor',
      key: 'dataZoomSelect',
      dataZoomSelectActive: true,
    });
  }

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

  const option: EChartsOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};
    if (data.timeSeries === null || data.timeSeries.length === 0) return noDataOption;

    const showPointsOnHover = data.timeSeries.length < PROGRESSIVE_MODE_SERIES_LIMIT;

    const defaultGrid = {
      show: true,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[100] : theme.palette.background.paper,
      borderColor: theme.palette.grey['300'],
      top: 10,
      right: 20,
      bottom: 0,
      left: 20,
      containLabel: true,
    };

    const defaultToolbox = {
      show: true,
      top: 10,
      right: 10,
      iconStyle: {
        borderColor: theme.palette.text.primary,
      },
      feature: {
        dataZoom: {
          icon: dataZoomEnabled ? null : undefined,
          yAxisIndex: 'none',
        },
        restore: {},
      },
      emphasis: {
        iconStyle: {
          textFill: theme.palette.text.primary,
        },
      },
    };

    if (dataZoomEnabled === false) {
      delete defaultToolbox.feature.dataZoom.icon;
    }

    const option = {
      title: {
        show: false,
      },
      grid: merge(defaultGrid, grid),
      toolbox: merge(defaultToolbox, toolbox),
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
        boundaryGap: ['10%', '10%'],
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
      tooltip: {
        show: showPointsOnHover,
        trigger: 'axis',
        showContent: false,
        axisPointer: {
          type: 'none',
        },
      },
      legend,
    };

    return option;
  }, [data, theme, grid, legend, toolbox]);

  return (
    <Box
      sx={{
        height,
      }}
      onMouseDown={handleOnMouseDown}
      onMouseUp={handleOnMouseUp}
      onMouseLeave={handleOnMouseLeave}
      onMouseEnter={handleOnMouseEnter}
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
