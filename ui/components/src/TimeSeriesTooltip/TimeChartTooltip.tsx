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

import { memo, MutableRefObject, useRef, useState } from 'react';
import { Box, Portal, Stack } from '@mui/material';
import { ECharts as EChartsInstance } from 'echarts/core';
import { FormatOptions, TimeSeries, TimeSeriesMetadata } from '@perses-dev/core';
import useResizeObserver from 'use-resize-observer';
import { TimeChartSeriesMapping } from '../model';
import { CursorCoordinates, PointAction, useMousePosition } from './tooltip-model';
import { assembleTransform, getTooltipStyles } from './utils';
import { getNearbySeriesData } from './nearby-series';
import { TooltipHeader } from './TooltipHeader';
import { TooltipContent } from './TooltipContent';
import { TooltipActions } from './TooltipActions';

export interface TimeChartTooltipProps {
  chartRef: MutableRefObject<EChartsInstance | undefined>;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  enablePinning?: boolean;
  pinnedPos: CursorCoordinates | null;
  /**
   * The id of the container that will have the chart tooltip appended to it.
   * By default, the chart tooltip is attached to document.body.
   */
  containerId?: string;
  onUnpinClick?: () => void;
  format?: FormatOptions;
  wrapLabels?: boolean;
  pointActions?: PointAction[];
  seriesMetadata?: TimeSeriesMetadata[];
}

export const TimeChartTooltip = memo(function TimeChartTooltip({
  containerId,
  chartRef,
  data,
  seriesMapping,
  enablePinning = true,
  wrapLabels,
  format,
  onUnpinClick,
  pinnedPos,
  pointActions = [],
  seriesMetadata,
}: TimeChartTooltipProps) {
  const [showAllSeries, setShowAllSeries] = useState(false);
  const [selectedSeriesIdx, setSelectedSeriesIdx] = useState<number | null>(null);
  const transform = useRef<string | undefined>();

  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver();

  const isTooltipPinned = pinnedPos !== null && enablePinning;

  if (mousePos === null || mousePos.target === null || data === null) return null;

  // Ensure user is hovering over a chart before checking for nearby series.
  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;

  const containerElement = containerId ? document.querySelector(containerId) : undefined;
  // if tooltip is attached to a container, set max height to the height of the container so tooltip does not get cut off
  const maxHeight = containerElement ? containerElement.getBoundingClientRect().height : undefined;

  transform.current = assembleTransform(mousePos, pinnedPos, height ?? 0, width ?? 0, containerElement);

  // Get series nearby the cursor and pass into tooltip content children.
  const nearbySeries = getNearbySeriesData({
    mousePos,
    data,
    seriesMapping,
    seriesMetadata,
    pinnedPos,
    chart,
    format,
    showAllSeries,
    selectedSeriesIdx,
  });

  const hasPointMenuItems = pointActions.length > 0;

  if (hasPointMenuItems && !isTooltipPinned) {
    const hasOneSeries = nearbySeries.length === 1;
    const firstSeriesClosestToCursor = nearbySeries.find((series) => series.isClosestToCursor);
    let nextSelectedSeriesIdx: number | null = hasOneSeries ? 0 : null;

    if (firstSeriesClosestToCursor) {
      nextSelectedSeriesIdx =
        (firstSeriesClosestToCursor.metadata?.isSelectable ?? true) ? firstSeriesClosestToCursor.seriesIdx : null;
    }

    if (nextSelectedSeriesIdx !== selectedSeriesIdx) {
      setSelectedSeriesIdx(nextSelectedSeriesIdx);
    }
  }

  const selectedSeries = nearbySeries.find((series) => series.isSelected);

  if (nearbySeries.length === 0) {
    return null;
  }

  const totalSeries = data.length;
  const allowActions = enablePinning && pointActions.length > 0;

  return (
    <Portal container={containerElement}>
      <Box
        ref={tooltipRef}
        sx={(theme) => getTooltipStyles(theme, pinnedPos, maxHeight)}
        style={{
          transform: transform.current,
        }}
      >
        <Stack spacing={0}>
          <TooltipHeader
            nearbySeries={nearbySeries}
            totalSeries={totalSeries}
            enablePinning={enablePinning}
            isTooltipPinned={isTooltipPinned}
            showAllSeries={showAllSeries}
            onShowAllClick={(checked) => setShowAllSeries(checked)}
            onUnpinClick={onUnpinClick}
          />
          <TooltipContent
            onSelected={
              hasPointMenuItems
                ? (seriesIdx): void => setSelectedSeriesIdx((prev) => (prev === seriesIdx ? null : seriesIdx))
                : undefined
            }
            series={nearbySeries}
            wrapLabels={wrapLabels}
            allowActions={allowActions}
          />
          {allowActions && (
            <TooltipActions
              selectedSeries={selectedSeries}
              actions={pointActions}
              onUnpinClick={onUnpinClick}
              isPinned={isTooltipPinned}
            />
          )}
        </Stack>
      </Box>
    </Portal>
  );
});
