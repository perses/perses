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
import { EChartsDataFormat } from '../model/graph-model';
import { getFocusedSeriesData } from './focused-series';
import {
  CursorCoordinates,
  CursorData,
  TooltipData,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MAX_WIDTH,
  useMousePosition,
} from './tooltip-model';
import { TooltipContent } from './TooltipContent';

interface TooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  tooltipData: TooltipData;
  chartData: EChartsDataFormat;
  wrapLabels?: boolean;
}

export function Tooltip(props: TooltipProps) {
  const { chartRef, chartData } = props;
  const [pinnedPos, setPinnedPos] = useState<CursorCoordinates | null>(null);
  const mousePos = useMousePosition();
  if (mousePos === null) return null;

  const chart = chartRef.current;
  const focusedSeries = getFocusedSeriesData(mousePos, chartData, pinnedPos, chart);
  const chartWidth = chart?.getWidth() ?? 750;
  const chartHeight = chart?.getHeight() ?? 230;
  const cursorTransform = assembleTransform(mousePos, focusedSeries.length, chartWidth, chartHeight, pinnedPos);

  function handleMouseEnter() {
    if (mousePos !== null) {
      setPinnedPos(mousePos);
    }
  }

  function handleMouseLeave() {
    if (pinnedPos !== null) {
      setPinnedPos(null);
    }
  }

  if (focusedSeries.length === 0) {
    return null;
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
        onMouseEnter={() => handleMouseEnter()}
        onMouseLeave={() => handleMouseLeave()}
      >
        <TooltipContent focusedSeries={focusedSeries} wrapLabels={props.wrapLabels} />
      </Box>
    </Portal>
  );
}

function assembleTransform(
  mousePos: CursorData['coords'],
  seriesNum: number,
  chartWidth: number,
  chartHeight: number,
  pinnedPos: CursorCoordinates | null
) {
  if (mousePos === null) {
    return 'translate3d(0, 0)';
  }

  if (pinnedPos !== null) {
    mousePos = pinnedPos;
  }

  const cursorPaddingX = 32;
  const cursorPaddingY = 16;
  const x = mousePos.viewport.x;
  let y = mousePos.viewport.y + cursorPaddingY;

  const isCloseToBottom = mousePos.viewport.y > window.innerHeight * 0.8;
  const yPosAdjustThreshold = chartHeight * 0.75;
  // adjust so tooltip does not get cut off at bottom of chart, reduce multiplier to move up
  if (isCloseToBottom === true) {
    if (seriesNum > 6) {
      y = mousePos.viewport.y * 0.65;
    } else {
      y = mousePos.viewport.y * 0.75;
    }
  } else if (mousePos.plotCanvas.y > yPosAdjustThreshold) {
    y = mousePos.viewport.y * 0.85;
  }

  // use tooltip width to determine when to repos from right to left (width is narrower when only 1 focused series since labels wrap)
  const tooltipWidth = seriesNum > 1 ? TOOLTIP_MAX_WIDTH : TOOLTIP_MAX_WIDTH / 2;
  const xPosAdjustThreshold = chartWidth - tooltipWidth * 0.9;

  // reposition so tooltip is never too close to right side of chart or left side of browser window
  return mousePos.plotCanvas.x > xPosAdjustThreshold && x > TOOLTIP_MAX_WIDTH
    ? `translate3d(${x - cursorPaddingX}px, ${y}px, 0) translateX(-100%)`
    : `translate3d(${x + cursorPaddingX}px, ${y}px, 0)`;
}
