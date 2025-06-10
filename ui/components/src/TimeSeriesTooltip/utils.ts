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
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_PADDING,
} from './tooltip-model';

/**
 * Determine position of tooltip depending on chart dimensions and the number of focused series
 */
export function assembleTransform(
  mousePos: CursorData['coords'],
  pinnedPos: CursorCoordinates | null,
  tooltipHeight: number,
  tooltipWidth: number,
  containerElement?: Element | null
): string | undefined {
  if (mousePos === null) {
    return undefined;
  }

  const cursorPaddingX = 32;
  const cursorPaddingY = 16;

  if (pinnedPos !== null) {
    mousePos = pinnedPos;
  }

  if (mousePos.plotCanvas.x === undefined) return undefined;

  let x = mousePos.page.x + cursorPaddingX; // Default to right side of the cursor
  let y = mousePos.page.y + cursorPaddingY;

  // If containerElement is defined, adjust coordinates relative to the container
  if (containerElement) {
    const containerRect = containerElement.getBoundingClientRect();
    x = x - containerRect.left + containerElement.scrollLeft;
    y = y - containerRect.top + containerElement.scrollTop;

    // Ensure tooltip does not go out of the container's bottom
    const containerBottom = containerRect.top + containerElement.scrollHeight;
    if (y + tooltipHeight > containerBottom) {
      y = Math.max(containerBottom - tooltipHeight - cursorPaddingY, TOOLTIP_PADDING / 2);
    }
  } else {
    // Ensure tooltip does not go out of the screen on the bottom
    if (y + tooltipHeight > window.innerHeight + window.scrollY) {
      y = Math.max(window.innerHeight + window.scrollY - tooltipHeight - cursorPaddingY, TOOLTIP_PADDING / 2);
    }
  }

  // Ensure tooltip does not go out of the screen on the right
  if (x + tooltipWidth > window.innerWidth) {
    x = mousePos.page.x - tooltipWidth - cursorPaddingX; // Move to the left of the cursor
  }

  // Ensure tooltip does not go out of the screen on the left
  if (x < cursorPaddingX) {
    x = cursorPaddingX;
  }

  // Ensure tooltip does not go out of the screen on the top
  if (y < TOOLTIP_PADDING / 2) {
    y = TOOLTIP_PADDING / 2;
  }

  return `translate3d(${x}px, ${y}px, 0)`;
}

/**
 * Helper for tooltip positioning styles
 */
export function getTooltipStyles(
  theme: Theme,
  pinnedPos: CursorCoordinates | null,
  maxHeight?: number
): Record<string, unknown> {
  const adjustedMaxHeight = maxHeight ? maxHeight - TOOLTIP_PADDING : undefined;
  return {
    minWidth: TOOLTIP_MIN_WIDTH,
    maxWidth: TOOLTIP_MAX_WIDTH,
    maxHeight: adjustedMaxHeight ?? TOOLTIP_MAX_HEIGHT,
    padding: 0,
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: '6px',
    fontSize: '11px',
    visibility: 'visible',
    opacity: 1,
    transition: 'all 0.1s ease-out',
    // LOGZ.IO CHANGE START:: Drilldown panel [APPZ-377]
    backgroundColor: theme.palette.background.paper ?? TOOLTIP_BG_COLOR_FALLBACK,
    color: theme.palette.text.primary,
    border: `1px solid ${theme.palette.grey['200']}`,
    boxShadow: theme.shadows[4],
    // LOGZ.IO CHANGE END:: Drilldown panel [APPZ-377]
    // Ensure pinned tooltip shows behind edit panel drawer and sticky header
    zIndex: pinnedPos !== null ? 'auto' : theme.zIndex.tooltip,
    overflow: 'hidden',
    '&:hover': {
      overflowY: 'auto',
    },
  };
}
