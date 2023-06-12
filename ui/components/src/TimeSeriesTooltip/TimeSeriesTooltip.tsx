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
import { ECharts as EChartsInstance } from 'echarts/core';
import { memo, useState } from 'react';
import useResizeObserver from 'use-resize-observer';
import { EChartsDataFormat, UnitOptions } from '../model';
import { TooltipContent } from './TooltipContent';
import { TooltipPluginContent, TooltipPluginProps } from './TooltipPlugin';
import { TooltipHeader } from './TooltipHeader';
import { getNearbySeriesData } from './nearby-series';
import { CursorCoordinates, FALLBACK_CHART_WIDTH, useMousePosition } from './tooltip-model';
import { assembleTransform, getTooltipStyles } from './utils';

export interface TimeSeriesTooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  chartData: EChartsDataFormat;
  wrapLabels?: boolean;
  unit?: UnitOptions;
  tooltipPlugin?: TooltipPluginProps;
  onUnpinClick?: () => void;
  pinnedPos: CursorCoordinates | null;
}

export const TimeSeriesTooltip = memo(function TimeSeriesTooltip({
  chartRef,
  chartData,
  wrapLabels,
  unit,
  tooltipPlugin,
  onUnpinClick,
  pinnedPos,
}: TimeSeriesTooltipProps) {
  const [showAllSeries, setShowAllSeries] = useState(false);
  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver();

  const isTooltipPinned = pinnedPos !== null;

  if (mousePos === null || mousePos.target === null) return null;

  // Ensure user is hovering over a chart before checking for nearby series.
  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;
  const chartWidth = chart?.getWidth() ?? FALLBACK_CHART_WIDTH; // Fallback width not likely to ever be needed.
  const cursorTransform = assembleTransform(mousePos, chartWidth, pinnedPos, height ?? 0, width ?? 0);

  const totalSeries = chartData.timeSeries.length;

  // Get series nearby the cursor and pass into tooltip content children.
  const nearbySeries = getNearbySeriesData({
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

  // If the user has provided a custom tooltipPlugin check whether to render it instead of default TooltipContent
  if (tooltipPlugin && nearbySeries !== null) {
    // Use the tooltip plugin if nearby series are all match desired series type
    // Example: Show annotation tooltip content for nearby 'scatter' series
    const isActive = nearbySeries?.every((series) => series.seriesType === tooltipPlugin.seriesTypeTrigger);
    if (isActive) {
      return (
        <Portal>
          <Box
            ref={tooltipRef}
            sx={(theme) => getTooltipStyles(theme)}
            style={{
              transform: cursorTransform,
            }}
          >
            <TooltipPluginContent tooltipOverride={tooltipPlugin.tooltipOverride} nearbySeries={nearbySeries} />
          </Box>
        </Portal>
      );
    }
  }

  return (
    <Portal>
      <Box
        ref={tooltipRef}
        sx={(theme) => getTooltipStyles(theme)}
        style={{
          transform: cursorTransform,
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
