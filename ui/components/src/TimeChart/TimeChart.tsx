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

import { DatasetOption } from 'echarts/types/dist/shared';
import { forwardRef, MouseEvent, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { utcToZonedTime } from 'date-fns-tz';
import { getCommonTimeScale, TimeScale, UnitOptions, TimeSeries } from '@perses-dev/core';
import type {
  EChartsCoreOption,
  GridComponentOption,
  LineSeriesOption,
  YAXisComponentOption,
  TooltipComponentOption,
} from 'echarts';
import { ECharts as EChartsInstance, use } from 'echarts/core';
import { LineChart as EChartsLineChart } from 'echarts/charts';
import {
  GridComponent,
  DatasetComponent,
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
import { ChartHandleFocusOpts, ChartHandle, TimeChartSeriesMapping } from '../model/graph';
import { useChartsTheme } from '../context/ChartsThemeProvider';
import {
  clearHighlightedSeries,
  enableDataZoom,
  getFormattedAxisLabel,
  getYAxes,
  restoreChart,
  ZoomEventData,
} from '../utils';
import { CursorCoordinates, TimeChartTooltip, TooltipConfig } from '../TimeSeriesTooltip';
import { useTimeZone } from '../context/TimeZoneProvider';

use([
  EChartsLineChart,
  GridComponent,
  DatasetComponent,
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

export interface TimeChartProps {
  height: number;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  timeScale?: TimeScale;
  yAxis?: YAXisComponentOption;
  unit?: UnitOptions;
  grid?: GridComponentOption;
  tooltipConfig?: TooltipConfig;
  noDataVariant?: 'chart' | 'message';
  syncGroup?: string;
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  __experimentalEChartsOptionsOverride?: (options: EChartsCoreOption) => EChartsCoreOption;
}

export const TimeChart = forwardRef<ChartHandle, TimeChartProps>(function TimeChart(
  {
    height,
    data,
    seriesMapping,
    timeScale: timeScaleProp,
    yAxis,
    unit,
    grid,
    tooltipConfig = { wrapLabels: true },
    noDataVariant = 'message',
    syncGroup,
    onDataZoom,
    onDoubleClick,
    __experimentalEChartsOptionsOverride,
  },
  ref
) {
  const chartsTheme = useChartsTheme();
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [tooltipPinnedCoords, setTooltipPinnedCoords] = useState<CursorCoordinates | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const { timeZone } = useTimeZone();
  const totalSeries = data?.length ?? 0;

  let timeScale: TimeScale;
  if (timeScaleProp === undefined) {
    const commonTimeScale = getCommonTimeScale(data);
    if (commonTimeScale === undefined) {
      // set default to past 5 years
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setFullYear(today.getFullYear() - 5);
      const todayMs = today.getTime();
      const pastDateMs = pastDate.getTime();
      timeScale = { startMs: pastDateMs, endMs: todayMs, stepMs: 1, rangeMs: todayMs - pastDateMs };
    } else {
      timeScale = commonTimeScale;
    }
  } else {
    timeScale = timeScaleProp;
  }

  useImperativeHandle(
    ref,
    () => {
      return {
        highlightSeries({ name }: ChartHandleFocusOpts) {
          if (!chartRef.current) {
            // No chart. Do nothing.
            return;
          }

          chartRef.current.dispatchAction({ type: 'highlight', seriesId: name });
        },
        clearHighlightedSeries: () => {
          if (!chartRef.current) {
            // No chart. Do nothing.
            return;
          }
          clearHighlightedSeries(chartRef.current, totalSeries);
        },
      };
    },
    [totalSeries]
  );

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
        const xAxisStartValue = params.batch[0].startValue;
        const xAxisEndValue = params.batch[0].endValue;
        if (xAxisStartValue !== undefined && xAxisEndValue !== undefined) {
          const zoomEvent: ZoomEventData = {
            start: xAxisStartValue,
            end: xAxisEndValue,
          };
          onDataZoom(zoomEvent);
        }
      },
    };
  }, [onDataZoom, setTooltipPinnedCoords]);

  if (chartRef.current !== undefined) {
    enableDataZoom(chartRef.current);
  }

  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
    // TODO: fix loading state and noData variants
    // if (data === undefined) return {};

    // The "chart" `noDataVariant` is only used when the `timeSeries` is an
    // empty array because a `null` value will throw an error.
    if (data === null || (data.length === 0 && noDataVariant === 'message')) return noDataOption;

    // Utilizes ECharts dataset so raw data is separate from series option style properties
    // https://apache.github.io/echarts-handbook/en/concepts/dataset/
    const dataset: DatasetOption[] = [];
    const isLocalTimeZone = timeZone === 'local';
    data.map((d, index) => {
      const values = d.values.map(([timestamp, value]) => {
        const val: string | number = value === null ? '-' : value; // echarts use '-' to represent null data
        return [isLocalTimeZone ? timestamp : utcToZonedTime(timestamp, timeZone), val];
      });
      dataset.push({ id: index, source: [...values], dimensions: ['time', 'value'] });
    });

    const option: EChartsCoreOption = {
      dataset: dataset,
      series: seriesMapping,
      xAxis: {
        type: 'time',
        min: isLocalTimeZone ? timeScale.startMs : utcToZonedTime(timeScale.startMs, timeZone),
        max: isLocalTimeZone ? timeScale.endMs : utcToZonedTime(timeScale.endMs, timeZone),
        axisLabel: {
          hideOverlap: true,
          formatter: getFormattedAxisLabel(timeScale.rangeMs ?? 0),
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
    };

    if (__experimentalEChartsOptionsOverride) {
      return __experimentalEChartsOptionsOverride(option);
    }
    return option;
  }, [
    data,
    seriesMapping,
    timeScale,
    yAxis,
    unit,
    grid,
    noDataOption,
    __experimentalEChartsOptionsOverride,
    noDataVariant,
    timeZone,
  ]);

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
        if (chartRef.current !== undefined) {
          clearHighlightedSeries(chartRef.current, totalSeries);
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
          <TimeChartTooltip
            chartRef={chartRef}
            data={data}
            seriesMapping={seriesMapping}
            wrapLabels={tooltipConfig.wrapLabels}
            pinnedPos={tooltipPinnedCoords}
            unit={unit}
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
});
