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

import { Box, Portal, Stack } from '@mui/material';
import { UnitOptions } from '@perses-dev/core';
import { ECharts as EChartsInstance } from 'echarts/core';
import { memo, useRef, useState } from 'react';
import useResizeObserver from 'use-resize-observer';
import { EChartsDataFormat } from '../model';
import { TooltipContent } from './TooltipContent';
import { TooltipHeader } from './TooltipHeader';
import { legacyGetNearbySeriesData } from './nearby-series';
import {
  CursorCoordinates,
  FALLBACK_CHART_WIDTH,
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_MIN_WIDTH,
  useMousePosition,
} from './tooltip-model';
import { assembleTransform } from './utils';

export interface TimeSeriesTooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  chartData: EChartsDataFormat;
  wrapLabels?: boolean;
  unit?: UnitOptions;
  onUnpinClick?: () => void;
  pinnedPos: CursorCoordinates | null;
  /**
   * The id of the container that will have the chart tooltip appended to it.
   * By default, the chart tooltip is attached to document.body.
   */
  containerId?: string;
}

export const LineChartTooltip = memo(function LineChartTooltip({
  chartRef,
  chartData,
  wrapLabels,
  unit,
  onUnpinClick,
  pinnedPos,
  containerId,
}: TimeSeriesTooltipProps) {
  const [showAllSeries, setShowAllSeries] = useState(false);
  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver();
  const transform = useRef('');

  const isTooltipPinned = pinnedPos !== null;

  if (mousePos === null || mousePos.target === null) return null;

  // Ensure user is hovering over a chart before checking for nearby series.
  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;
  const chartWidth = chart?.getWidth() ?? FALLBACK_CHART_WIDTH; // Fallback width not likely to ever be needed.

  // Get series nearby the cursor and pass into tooltip content children.
  const nearbySeries = legacyGetNearbySeriesData({
    mousePos,
    chartData,
    pinnedPos,
    chart,
    unit,
    showAllSeries,
  });
  if (nearbySeries.length === 0) {
    return null;
  }

  const totalSeries = chartData.timeSeries.length;

  const containerElement = containerId ? document.querySelector(containerId) : undefined;
  // if tooltip is attached to a container, set max height to the height of the container so tooltip does not get cut off
  const maxHeight = containerElement ? containerElement.getBoundingClientRect().height : undefined;
  if (!isTooltipPinned) {
    transform.current = assembleTransform(mousePos, chartWidth, pinnedPos, height ?? 0, width ?? 0, containerElement);
  }

  return (
    <Portal container={containerElement}>
      <Box
        ref={tooltipRef}
        sx={(theme) => ({
          minWidth: TOOLTIP_MIN_WIDTH,
          maxWidth: TOOLTIP_MAX_WIDTH,
          maxHeight: maxHeight ?? TOOLTIP_MAX_HEIGHT,
          padding: 0,
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: theme.palette.designSystem?.grey[800] ?? TOOLTIP_BG_COLOR_FALLBACK,
          borderRadius: '6px',
          color: '#fff',
          fontSize: '11px',
          visibility: 'visible',
          opacity: 1,
          transition: 'all 0.1s ease-out',
          zIndex: theme.zIndex.tooltip,
          overflow: 'hidden',
          '&:hover': {
            overflowY: 'auto',
          },
        })}
        style={{
          transform: transform.current,
        }}
      >
        <Stack spacing={0.5}>
          <TooltipHeader
            nearbySeries={nearbySeries}
            totalSeries={totalSeries}
            isTooltipPinned={isTooltipPinned}
            showAllSeries={showAllSeries}
            onShowAllClick={(checked) => setShowAllSeries(checked)}
            onUnpinClick={onUnpinClick}
          />
          <TooltipContent series={nearbySeries} wrapLabels={wrapLabels} />
        </Stack>
      </Box>
    </Portal>
  );
});
