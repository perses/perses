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

import { Theme } from '@mui/material';
import {
  CursorCoordinates,
  CursorData,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MIN_WIDTH,
  TOOLTIP_ADJUST_Y_POS_MULTIPLIER,
  TOOLTIP_BG_COLOR_FALLBACK,
} from './tooltip-model';

/**
 * Determine position of tooltip depending on chart dimensions and the number of focused series
 */
export function assembleTransform(
  mousePos: CursorData['coords'],
  chartWidth: number,
  pinnedPos: CursorCoordinates | null,
  tooltipHeight: number,
  tooltipWidth: number
) {
  if (mousePos === null) {
    return 'translate3d(0, 0)';
  }

  const cursorPaddingX = 32;
  const cursorPaddingY = 16;

  if (pinnedPos !== null) {
    mousePos = pinnedPos;
  }

  // Tooltip is located in a Portal attached to the body.
  // Using page coordinates instead of viewport ensures the tooltip is
  // absolutely positioned correctly as the user scrolls
  const x = mousePos.page.x;
  let y = mousePos.page.y + cursorPaddingY;

  // adjust so tooltip does not get cut off at bottom of chart
  if (mousePos.client.y + tooltipHeight + cursorPaddingY > window.innerHeight) {
    // multiplier ensures tooltip isn't overly adjusted and gets cut off at the top of the viewport
    y = mousePos.page.y - tooltipHeight * TOOLTIP_ADJUST_Y_POS_MULTIPLIER;
  }

  // use tooltip width to determine when to repos from right to left
  const xPosAdjustThreshold = chartWidth - tooltipWidth * 0.9;

  // reposition so tooltip is never too close to right side of chart or left side of browser window
  return mousePos.plotCanvas.x > xPosAdjustThreshold && x > TOOLTIP_MAX_WIDTH
    ? `translate3d(${x - cursorPaddingX}px, ${y}px, 0) translateX(-100%)`
    : `translate3d(${x + cursorPaddingX}px, ${y}px, 0)`;
}

/**
 * Helper for tooltip positioning styles
 */
export function getTooltipStyles(theme: Theme) {
  return {
    minWidth: TOOLTIP_MIN_WIDTH,
    maxWidth: TOOLTIP_MAX_WIDTH,
    maxHeight: TOOLTIP_MAX_HEIGHT,
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
  };
}
