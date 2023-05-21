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

import { Box, Portal, Typography, Stack, Switch } from '@mui/material';
import { ECharts as EChartsInstance } from 'echarts/core';
import React, { useState } from 'react';
import useResizeObserver from 'use-resize-observer';
import { EChartsDataFormat, UnitOptions } from '../model';
import { TooltipContent } from './TooltipContent';
import { getFocusedSeriesData } from './focused-series';
import {
  CursorCoordinates,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MIN_WIDTH,
  TOOLTIP_MAX_WIDTH,
  useMousePosition,
} from './tooltip-model';
import { assembleTransform } from './utils';

interface TimeSeriesTooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  chartData: EChartsDataFormat;
  tooltipPinned: boolean;
  wrapLabels?: boolean;
  unit?: UnitOptions;
}

export const TimeSeriesTooltip = React.memo(function TimeSeriesTooltip({
  chartRef,
  chartData,
  wrapLabels,
  tooltipPinned,
  unit,
}: TimeSeriesTooltipProps) {
  const [showAllSeries, setShowAllSeries] = useState(false);
  const [pinnedPos, setPinnedPos] = useState<CursorCoordinates | null>(null);
  const mousePos = useMousePosition();
  const { height, width, ref: tooltipRef } = useResizeObserver();

  if (mousePos === null || mousePos.target === null) return null;

  // ensure user is hovering over a chart before checking for nearby series
  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;
  const focusedSeries = getFocusedSeriesData({ mousePos, chartData, pinnedPos, chart, unit, showAllSeries });
  const chartWidth = chart?.getWidth() ?? 750;
  const cursorTransform = assembleTransform(mousePos, chartWidth, pinnedPos, height ?? 0, width ?? 0);

  if (focusedSeries.length === 0) {
    return null;
  }

  if (tooltipPinned === true && pinnedPos === null) {
    setPinnedPos(mousePos);
  }

  return (
    <Portal>
      <Box
        ref={tooltipRef}
        sx={(theme) => ({
          minWidth: TOOLTIP_MIN_WIDTH,
          maxWidth: TOOLTIP_MAX_WIDTH,
          maxHeight: TOOLTIP_MAX_HEIGHT,
          padding: theme.spacing(0.5, 2),
          position: 'absolute',
          top: 0,
          left: 0,
          backgroundColor: '#2E313E', // TODO: use colors from theme, separate styles for dark mode
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
          transform: cursorTransform,
        }}
      >
        <TooltipContent
          focusedSeries={focusedSeries}
          wrapLabels={wrapLabels}
          tooltipPinned={tooltipPinned || showAllSeries}
        />

        <Stack direction="row" gap={1} alignItems="center" sx={{ textAlign: 'right' }}>
          <Typography>Show All?</Typography>
          <Switch checked={showAllSeries} onChange={(_, checked) => setShowAllSeries(checked)} />
        </Stack>
      </Box>
    </Portal>
  );
});
