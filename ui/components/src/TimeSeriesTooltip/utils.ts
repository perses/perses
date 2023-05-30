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

import { CursorCoordinates, CursorData, TOOLTIP_MAX_WIDTH, TOOLTIP_ADJUST_Y_POS_MULTIPLIER } from './tooltip-model';

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
    return `translate3d(${pinnedPos.page.x + cursorPaddingX}px, ${pinnedPos.page.y}px, 0)`;
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
