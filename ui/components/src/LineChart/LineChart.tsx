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
import { EChartsDataFormat } from '../model/graph';
import { UnitOptions } from '../model/units';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { TimeSeriesTooltip } from '../TimeSeriesTooltip';
import { useTimeZone } from '../context/TimeZoneProvider';
import { CursorCoordinates } from '../TimeSeriesTooltip/tooltip-model';
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

export type TooltipConfig = {
  wrapLabels: boolean;
  hidden?: boolean;
};

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
  tooltipConfig?: TooltipConfig;
  noDataVariant?: 'chart' | 'message';
  syncGroup?: string;
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
  tooltipConfig = { wrapLabels: true },
  noDataVariant = 'message',
  syncGroup,
  onDataZoom,
  onDoubleClick,
  __experimentalEChartsOptionsOverride,
}: LineChartProps) {
  const chartsTheme = useChartsTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [tooltipPinnedCoords, setTooltipPinnedCoords] = useState<CursorCoordinates | null>(null);
  const { timeZone } = useTimeZone();

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleEvents: OnEventsType<LineSeriesOption['data'] | unknown> = useMemo(() => {
    return {
      datazoom: (params) => {
        if (onDataZoom === undefined) {
          setTimeout(() => {
            // workaround so unpin happens after click event
            setTooltipPinnedCoords(null);
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
  }, [data, onDataZoom, setTooltipPinnedCoords]);

  if (chartRef.current !== undefined) {
    enableDataZoom(chartRef.current);
  }

  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};

    // The "chart" `noDataVariant` is only used when the `timeSeries` is an
    // empty array because a `null` value will throw an error.
    if (data.timeSeries === null || (data.timeSeries.length === 0 && noDataVariant === 'message')) return noDataOption;

    const rangeMs = data.rangeMs ?? getDateRange(data.xAxis);

    const option: EChartsCoreOption = {
      series: data.timeSeries,
      xAxis: {
        type: 'category',
        data: data.xAxis,
        max: data.xAxisMax,
        axisLabel: {
          // https://echarts.apache.org/en/option.html#xAxis.axisLabel.interval
          interval: 0, // Show all labels for every axis tick
          // interval: (index: number, value: string) => {
          //   console.log('INDEX: ', index);
          //   console.log('VALUE: ', value);
          //   // return 'auto';
          //   return true;
          // },
          // interval: 1,
          // interval: 2,
          rotate: 0,
          hideOverlap: true,
          formatter: (value: number) => {
            // console.log('xAxis - axisLabel -> value: ', value);
            return getFormattedDate(value, rangeMs, timeZone);
          },
        },
      },
      yAxis: getYAxes(yAxis, unit),
      animation: false,
      tooltip: {
        show: true,
        trigger: 'axis',
        showContent: false, // echarts tooltip content hidden since we use custom tooltip instead
      },
      // https://echarts.apache.org/en/option.html#axisPointer
      axisPointer: {
        type: 'line',
        z: 0, // ensure point symbol shows on top of dashed line
        triggerEmphasis: false, // https://github.com/apache/echarts/issues/18495
        triggerTooltip: false,
        snap: true,
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
  }, [data, yAxis, unit, grid, legend, noDataOption, timeZone, __experimentalEChartsOptionsOverride, noDataVariant]);

  return (
    <Box
      sx={{ height }}
      onClick={(e) => {
        // Pin and unpin when clicking on chart canvas but not tooltip text.
        if (e.target instanceof HTMLCanvasElement) {
          setTooltipPinnedCoords((current) => {
            if (current === null) {
              return {
                page: {
                  x: e.pageX,
                  y: e.pageY,
                },
                client: {
                  x: e.clientX,
                  y: e.clientY,
                },
                plotCanvas: {
                  x: e.nativeEvent.offsetX,
                  y: e.nativeEvent.offsetY,
                },
                target: e.target,
              };
            } else {
              return null;
            }
          });
        }
      }}
      onMouseDown={(e) => {
        const { clientX } = e;
        setIsDragging(true);
        setStartX(clientX);
      }}
      onMouseMove={(e) => {
        // Allow clicking inside tooltip to copy labels.
        if (!(e.target instanceof HTMLCanvasElement)) {
          return;
        }
        const { clientX } = e;
        if (isDragging) {
          const deltaX = clientX - startX;
          if (deltaX > 0) {
            // Hide tooltip when user drags to zoom.
            setShowTooltip(false);
          }
        }
      }}
      onMouseUp={() => {
        setIsDragging(false);
        setStartX(0);
        setShowTooltip(true);
      }}
      onMouseLeave={() => {
        if (tooltipPinnedCoords === null) {
          setShowTooltip(false);
        }
      }}
      onMouseEnter={() => {
        setShowTooltip(true);
        if (chartRef.current !== undefined) {
          enableDataZoom(chartRef.current);
        }
      }}
      onDoubleClick={(e) => {
        setTooltipPinnedCoords(null);
        // either dispatch ECharts restore action to return to orig state or allow consumer to define behavior
        if (onDoubleClick === undefined) {
          if (chartRef.current !== undefined) {
            restoreChart(chartRef.current);
          }
        } else {
          onDoubleClick(e);
        }
      }}
    >
      {/* Allows overrides prop to hide custom tooltip and use the ECharts option.tooltip instead */}
      {showTooltip === true &&
        (option.tooltip as TooltipComponentOption)?.showContent === false &&
        tooltipConfig.hidden !== true && (
          <TimeSeriesTooltip
            chartRef={chartRef}
            chartData={data}
            wrapLabels={tooltipConfig.wrapLabels}
            pinnedPos={tooltipPinnedCoords}
            unit={unit}
            onUnpinClick={() => {
              setTooltipPinnedCoords(null);
            }}
          />
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
        syncGroup={syncGroup}
      />
    </Box>
  );
}
