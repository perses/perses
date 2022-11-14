// Copyright 2022 The Perses Authors
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

import React, { useState } from 'react';
import { Box, Portal } from '@mui/material';
import { ECharts as EChartsInstance } from 'echarts/core';
import { EChartsDataFormat } from '../model/graph';
import { getFocusedSeriesData } from './focused-series';
import { CursorCoordinates, TOOLTIP_MAX_HEIGHT, TOOLTIP_MAX_WIDTH, useMousePosition } from './tooltip-model';
import { TooltipContent } from './TooltipContent';
import { assembleTransform } from './utils';

interface TooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  chartData: EChartsDataFormat;
  pinTooltip: boolean;
  wrapLabels?: boolean;
  unit?: UnitOptions;
}

const Tooltip = React.memo(function Tooltip({ chartRef, chartData, wrapLabels, pinTooltip, unit }: TooltipProps) {
  const [pinnedPos, setPinnedPos] = useState<CursorCoordinates | null>(null);
  const mousePos = useMousePosition();

  if (mousePos === null || mousePos.target === null) return null;

  // ensure user is hovering over a chart before checking for nearby series
  if (pinnedPos === null && (mousePos.target as HTMLElement).tagName !== 'CANVAS') return null;

  const chart = chartRef.current;
  const focusedSeries = getFocusedSeriesData(mousePos, chartData, pinnedPos, chart, unit);
  const chartWidth = chart?.getWidth() ?? 750;
  const chartHeight = chart?.getHeight() ?? 230;
  const cursorTransform = assembleTransform(mousePos, focusedSeries.length, chartWidth, chartHeight, pinnedPos);

  if (focusedSeries.length === 0) {
    return null;
  }

  if (pinTooltip === true && pinnedPos === null) {
    setPinnedPos(mousePos);
  }

  return (
    <Portal>
      <Box
        sx={(theme) => ({
          maxWidth: TOOLTIP_MAX_WIDTH,
          maxHeight: TOOLTIP_MAX_HEIGHT,
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
        <TooltipContent focusedSeries={focusedSeries} wrapLabels={wrapLabels} />
      </Box>
    </Portal>
  );
});

export { Tooltip };
