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
import { AnnotationEvent } from '@perses-dev/core';
import { EChart, OnEventsType } from '../EChart';
import { EChartsDataFormat, EChartsTimeSeries, OPTIMIZED_MODE_SERIES_LIMIT } from '../model/graph';
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
  annotations?: AnnotationEvent[];
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
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
  annotations = [],
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

    let series = data.timeSeries;

    const startTime = data.xAxis[0];
    const endTime = data.xAxis[data.xAxis.length - 1];

    if (annotations.length > 0) {
      const annotationLines = annotations.filter((a) => !a.endTimestamp);
      const annotationAreas = annotations.filter((a) => a.endTimestamp);
      series = series.concat([
        {
          name: 'Annotations',
          type: 'line',
          xAxisIndex: 1,
          data: [[startTime, null] as unknown],
          markArea: {
            data: annotationAreas.map((a) => {
              return [
                {
                  xAxis: a.timestamp,
                  itemStyle: {
                    color: a.color,
                    opacity: 0.2,
                  },
                },
                { xAxis: a.endTimestamp },
              ];
            }),
          },
          markLine: {
            label: {
              show: false,
            },
            symbol: 'none',
            lineStyle: {
              width: 1,
              type: 'dashed',
            },
            data: annotationLines.map((a) => ({
              symbol: 'none',
              symbolSize: 0,

              itemStyle: {
                color: a.color ?? undefined,
              },
              xAxis: a.timestamp,
            })),
          },
        } as EChartsTimeSeries,
      ]);
    }

    const option: EChartsCoreOption = {
      series: series,
      xAxis: [
        {
          type: 'category',
          data: data.xAxis,
          max: data.xAxisMax,
          axisLabel: {
            formatter: (value: number) => {
              return getFormattedDate(value, rangeMs, timeZone);
            },
          },
        },
        {
          show: false,
          type: 'time',
          data: data.xAxis,
          max: endTime,
          axisLine: {
            show: false,
          },
          axisTick: {
            show: false,
          },
          axisLabel: {
            show: false,
          },
          axisPointer: {
            show: false,
          },
        },
      ],
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
    console.log(option);

    return option;
  }, [data, yAxis, unit, grid, legend, noDataOption, timeZone]);

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
      {showTooltip === true && (
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
