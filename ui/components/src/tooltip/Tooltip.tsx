// Copyright 2021 The Perses Authors
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
import TooltipContent from './TooltipContent';

interface TooltipProps {
  chartRef: React.MutableRefObject<EChartsInstance | undefined>;
  tooltipData: TooltipData;
  chartData: EChartsDataFormat;
  wrapLabels?: boolean;
}

export function Tooltip(props: TooltipProps) {
  const { chartRef, chartData } = props;

  // TODO (sjcobb): both isPinned and pinnedPos necessary?
  const [isPinned, setTooltipPinned] = useState<boolean>(false);
  const [pinnedPos, setPinnedPos] = useState<CursorCoordinates | null>(null);

  const mousePosition = useMousePosition();
  if (mousePosition === null) return null;

  const chart = chartRef.current;
  const focusedSeries = getFocusedSeriesData(mousePosition, chartData, pinnedPos, isPinned, chart);
  const chartWidth = chart?.getWidth() ?? 1000;
  const chartHeight = chart?.getHeight() ?? 250;
  const cursorTransform = assembleTransform(mousePosition, focusedSeries.length, chartWidth, chartHeight, isPinned);

  function handleMouseEnter() {
    setTooltipPinned(true);
    if (mousePosition !== null) {
      setPinnedPos(mousePosition);
    }
  }

  function handleMouseLeave() {
    if (isPinned === true) {
      setTooltipPinned(false);
    }
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
          overflowY: 'scroll',
          backgroundColor: '#000',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '11px',
          visibility: 'visible',
          opacity: 1,
          transition: 'all 0.1s ease-out',
          zIndex: theme.zIndex.tooltip,
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
  mousePosition: CursorData['coords'],
  seriesNum: number,
  chartWidth: number,
  chartHeight: number,
  isPinned: boolean
) {
  if (mousePosition === null || isPinned === true) {
    return 'translate3d(0, 0)';
  }

  const cursorPaddingX = 32;
  const cursorPaddingY = 16;
  const x = mousePosition.viewport.x;
  let y = mousePosition.viewport.y + cursorPaddingY;

  const isCloseToBottom = mousePosition.viewport.y > window.innerHeight * 0.8;
  const yPosAdjustThreshold = chartHeight * 0.75;
  // adjust so tooltip does not get cut off at bottom of chart, reduce multiplier to move up
  if (isCloseToBottom === true) {
    y = mousePosition.viewport.y * 0.7;
  } else if (mousePosition.plotCanvas.y > yPosAdjustThreshold) {
    y = mousePosition.viewport.y * 0.8;
  }

  // TODO (sjcobb): fix so top-left charts do not get cut off
  // use tooltip width to determine when to repos from right to left (width is narrower when only 1 focused series since labels wrap)
  const tooltipWidth = seriesNum > 1 ? TOOLTIP_MAX_WIDTH : TOOLTIP_MAX_WIDTH / 2;
  const xPosAdjustThreshold = chartWidth - tooltipWidth * 0.9;

  return mousePosition.plotCanvas.x < xPosAdjustThreshold
    ? `translate3d(${x + cursorPaddingX}px, ${y}px, 0)`
    : `translate3d(${x - cursorPaddingX}px, ${y}px, 0) translateX(-100%)`;
}
