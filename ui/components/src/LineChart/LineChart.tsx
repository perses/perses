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
  XAXisComponentOption,
} from 'echarts';
import { ECharts as EChartsInstance, use } from 'echarts/core';
import { LineChart as EChartsLineChart, ScatterChart as EChartsScatterChart } from 'echarts/charts';
import { LabelLayout } from 'echarts/features';
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
import { EChart, MouseEventsParameters, OnEventsType } from '../EChart';
import { EChartsDataFormat } from '../model/graph';
import { formatValue, UnitOptions } from '../model/units';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import { TimeSeriesTooltip, TooltipConfig } from '../TimeSeriesTooltip';
import { useTimeZone } from '../context/TimeZoneProvider';
import { CursorCoordinates } from '../TimeSeriesTooltip/tooltip-model';
import { enableDataZoom, getDateRange, getFormattedDate, getYAxes, restoreChart, ZoomEventData } from './utils';

use([
  EChartsLineChart,
  EChartsScatterChart,
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
  LabelLayout,
]);

export interface LineChartProps {
  /**
   * Height of the chart
   */
  height: number;
  data: EChartsDataFormat;
  // yAxis?: YAXisComponentOption;
  xAxis?: XAXisComponentOption[];
  unit?: UnitOptions;
  grid?: GridComponentOption;
  legend?: LegendComponentOption;
  tooltipConfig?: TooltipConfig;
  noDataVariant?: 'chart' | 'message';
  syncGroup?: string;
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  onClick?: (e: MouseEventsParameters<unknown>, data: EChartsDataFormat) => void;
  __experimentalEChartsOptionsOverride?: (options: EChartsCoreOption) => EChartsCoreOption;
}

export function LineChart({
  height,
  data,
  // yAxis, // TODO: add back
  xAxis,
  unit,
  grid,
  legend,
  tooltipConfig = { wrapLabels: true },
  noDataVariant = 'message',
  syncGroup,
  onDataZoom,
  onDoubleClick,
  onClick,
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
    const clickHandler = onClick ? { click: (e: MouseEventsParameters<unknown>) => onClick(e, data) } : {};
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
      ...clickHandler,
    };
  }, [data, onDataZoom, onClick, setTooltipPinnedCoords]);

  if (chartRef.current !== undefined) {
    enableDataZoom(chartRef.current);
  }

  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
    if (data.timeSeries === undefined) return {};

    // The "chart" `noDataVariant` is only used when the `timeSeries` is an
    // empty array because a `null` value will throw an error.
    if (data.timeSeries === null || (data.timeSeries.length === 0 && noDataVariant === 'message')) return noDataOption;

    // annotations are plotted on hidden xAxis
    const annotationsPopulated = data.xAxisAlt !== undefined && data.xAxisAlt.length > 0;

    // when events are present increase padding above time series data so tooltip less likely to clash
    // const eventsBoundaryOffset = annotationsPopulated ? '50%' : '10%'; // TODO: play around with first value since ideal value depends on data
    const eventsBoundaryOffset = annotationsPopulated ? '150%' : '10%';

    const yAxisPrimary: YAXisComponentOption = {
      type: 'value',
      boundaryGap: [0, eventsBoundaryOffset],
      axisLabel: {
        showMaxLabel: !annotationsPopulated,
        formatter: (value: number) => {
          return formatValue(value, unit);
        },
      },
    };

    // Allow support for secondary axis upon which annotations can be displayed.
    // If no annotations are provided, this axis will not be displayed.
    const yAxisSecondary: YAXisComponentOption = data.xAxisAlt
      ? {
          show: false,
          type: 'value',
          data: data.timeSeries.reduce<number[]>((accum, series, idx) => {
            if (series.type === 'line') {
              accum.push(idx);
            }
            return accum;
          }, []),
          axisTick: {
            show: false,
          },
          axisLabel: {
            show: true,
          },
          axisLine: {
            show: false,
          },
        }
      : {};

    const rangeMs = data.rangeMs ?? getDateRange(data.xAxis);

    const defaultXAxis: XAXisComponentOption = {
      type: 'category',
      data: data.xAxis,
      max: data.xAxisMax,
      axisLabel: {
        formatter: (value: string) => {
          return getFormattedDate(Number(value) ?? 0, rangeMs, timeZone);
        },
      },
    };

    const option: EChartsCoreOption = {
      series: data.timeSeries,
      xAxis: xAxis ?? [defaultXAxis],
      yAxis: [...getYAxes(yAxisPrimary, unit), yAxisSecondary],
      animation: false,
      tooltip: {
        show: !annotationsPopulated, // hide axis pointer when events are present or else two dotted lines show
        trigger: 'axis',
        showContent: false, // echarts tooltip content hidden since we use custom tooltip instead
        axisPointer: {
          type: annotationsPopulated ? 'none' : 'line',
          z: 0, // ensure point symbol shows on top of dashed line
        },
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
  }, [data, xAxis, unit, grid, legend, noDataOption, timeZone, __experimentalEChartsOptionsOverride, noDataVariant]);

  console.log('(perses) LineChart -> option: ', option);
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
            tooltipPlugin={tooltipConfig.plugin}
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
