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

import { forwardRef, MouseEvent, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import merge from 'lodash/merge';
import isEqual from 'lodash/isEqual';
import { DatasetOption } from 'echarts/types/dist/shared';
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
import { LineChart as EChartsLineChart, BarChart as EChartsBarChart } from 'echarts/charts';
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
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { EChart, OnEventsType } from '../EChart';
import { ChartInstanceFocusOpts, ChartInstance, TimeChartSeriesMapping, DEFAULT_PINNED_CROSSHAIR } from '../model';
import { useChartsContext } from '../context/ChartsProvider';
import {
  checkCrosshairPinnedStatus,
  clearHighlightedSeries,
  enableDataZoom,
  getFormattedAxisLabel,
  getPointInGrid,
  getYAxes,
  restoreChart,
  ZoomEventData,
} from '../utils';
import { CursorCoordinates, TimeChartTooltip, TooltipConfig, DEFAULT_TOOLTIP_CONFIG } from '../TimeSeriesTooltip';
import { useTimeZone } from '../context/TimeZoneProvider';

use([
  EChartsLineChart,
  EChartsBarChart,
  GridComponent,
  DatasetComponent,
  DataZoomComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
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
  isStackedBar?: boolean;
  onDataZoom?: (e: ZoomEventData) => void;
  onDoubleClick?: (e: MouseEvent) => void;
  __experimentalEChartsOptionsOverride?: (options: EChartsCoreOption) => EChartsCoreOption;
}

export const TimeChart = forwardRef<ChartInstance, TimeChartProps>(function TimeChart(
  {
    height,
    data,
    seriesMapping,
    timeScale: timeScaleProp,
    yAxis,
    unit,
    grid,
    isStackedBar = false,
    tooltipConfig = DEFAULT_TOOLTIP_CONFIG,
    noDataVariant = 'message',
    syncGroup,
    onDataZoom,
    onDoubleClick,
    __experimentalEChartsOptionsOverride,
  },
  ref
) {
  const { chartsTheme, enablePinning, lastTooltipPinnedCoords, setLastTooltipPinnedCoords } = useChartsContext();
  const isPinningEnabled = tooltipConfig.enablePinning && enablePinning;
  const chartRef = useRef<EChartsInstance>();
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [tooltipPinnedCoords, setTooltipPinnedCoords] = useState<CursorCoordinates | null>(null);
  const [pinnedCrosshair, setPinnedCrosshair] = useState<LineSeriesOption | null>(null);
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
        highlightSeries({ name }: ChartInstanceFocusOpts) {
          if (!chartRef.current) {
            // when chart undef, do not highlight series when hovering over legend
            return;
          }

          chartRef.current.dispatchAction({ type: 'highlight', seriesId: name });
        },
        clearHighlightedSeries: () => {
          if (!chartRef.current) {
            // when chart undef, do not clear highlight series
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
      finished: () => {
        if (chartRef.current !== undefined) {
          enableDataZoom(chartRef.current);
        }
      },
    };
  }, [onDataZoom, setTooltipPinnedCoords]);

  const { noDataOption } = chartsTheme;

  const option: EChartsCoreOption = useMemo(() => {
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
      series: { seriesMapping, ...pinnedCrosshair },
      xAxis: {
        type: 'time',
        min: isLocalTimeZone ? timeScale.startMs : utcToZonedTime(timeScale.startMs, timeZone),
        max: isLocalTimeZone ? timeScale.endMs : utcToZonedTime(timeScale.endMs, timeZone),
        axisLabel: {
          hideOverlap: true,
          formatter: getFormattedAxisLabel(timeScale.rangeMs ?? 0),
        },
        axisPointer: {
          snap: false, // important so shared crosshair does not lag
        },
      },
      yAxis: getYAxes(yAxis, unit),
      animation: false,
      tooltip: {
        show: true,
        // ECharts tooltip content hidden by default since we use custom tooltip instead.
        // Stacked bar uses ECharts tooltip so subgroup data shows correctly.
        showContent: isStackedBar,
        trigger: isStackedBar ? 'item' : 'axis',
        appendToBody: true,
      },
      // https://echarts.apache.org/en/option.html#axisPointer
      axisPointer: {
        type: 'line',
        z: 0, // ensure point symbol shows on top of dashed line
        triggerEmphasis: false, // https://github.com/apache/echarts/issues/18495
        triggerTooltip: false,
        snap: false, // xAxis.axisPointer.snap takes priority
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
    // tooltipPinnedCoords is needed in dep array so crosshair stays beside pinned tooltip onClick
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    tooltipPinnedCoords,
    isStackedBar,
  ]);

  // Update adjacent charts so tooltip is unpinned when current chart is clicked.
  useEffect(() => {
    // Only allow pinning one tooltip at a time, subsequent tooltip click unpins previous.
    // Multiple tooltips can only be pinned if Ctrl or Cmd key is pressed while clicking.
    if (tooltipPinnedCoords !== null && lastTooltipPinnedCoords !== null) {
      if (!isEqual(lastTooltipPinnedCoords, tooltipPinnedCoords)) {
        setTooltipPinnedCoords(null);
      }
      const isCrosshairPinned = checkCrosshairPinnedStatus(seriesMapping);
      if (tooltipPinnedCoords !== null && isCrosshairPinned) {
        // seriesMapping.pop();
        setPinnedCrosshair(null);
      }
    }
    // tooltipPinnedCoords CANNOT be in dep array or tooltip pinning breaks in the current chart's onClick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTooltipPinnedCoords, seriesMapping]);

  return (
    <Box
      sx={{ height }}
      onClick={(e) => {
        // Determine where on chart canvas to plot pinned crosshair as markLine.
        const pointInGrid = getPointInGrid(e.nativeEvent.offsetX, e.nativeEvent.offsetY, chartRef.current);
        if (pointInGrid === null) {
          return;
        }

        // Allows user to opt-in to multi tooltip pinning when Ctrl or Cmd key held down
        const isControlKeyPressed = e.ctrlKey || e.metaKey;

        // Pin and unpin when clicking on chart canvas but not tooltip text.
        // if (!isAnyTooltipPinned && isPinningEnabled && e.target instanceof HTMLCanvasElement) {
        if (isPinningEnabled && e.target instanceof HTMLCanvasElement) {
          setTooltipPinnedCoords((current) => {
            if (current === null) {
              // Clear previously set pinned crosshair
              const isCrosshairPinned = checkCrosshairPinnedStatus(seriesMapping);
              if (tooltipPinnedCoords !== null && isCrosshairPinned) {
                setPinnedCrosshair(null);
                // seriesMapping.pop();
              } else if (seriesMapping.length !== data.length + 1) {
                // Only add pinned crosshair line series when there is not one already in seriesMapping.
                const pinnedCrosshair = merge(DEFAULT_PINNED_CROSSHAIR, {
                  markLine: {
                    data: [
                      {
                        xAxis: pointInGrid[0],
                      },
                    ],
                  },
                } as LineSeriesOption);
                setPinnedCrosshair(pinnedCrosshair);
              }

              // Pin tooltip and update shared charts context to remember these coordinates.
              const pinnedPos: CursorCoordinates = {
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
              if (!isControlKeyPressed) {
                setLastTooltipPinnedCoords(pinnedPos);
              }
              return pinnedPos;
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
            containerId={chartsTheme.tooltipPortalContainerId}
            chartRef={chartRef}
            data={data}
            seriesMapping={seriesMapping}
            wrapLabels={tooltipConfig.wrapLabels}
            enablePinning={isPinningEnabled}
            pinnedPos={tooltipPinnedCoords}
            unit={unit}
            onUnpinClick={() => {
              // Unpins tooltip when clicking Pin icon in TooltipHeader.
              setTooltipPinnedCoords(null);
              // Clear previously set pinned crosshair.
              const isCrosshairPinned = checkCrosshairPinnedStatus(seriesMapping);
              if (isCrosshairPinned) {
                setPinnedCrosshair(null);
                // seriesMapping.pop();
              }
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
});
