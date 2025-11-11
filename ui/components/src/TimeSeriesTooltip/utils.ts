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
import { ECharts as EChartsInstance } from 'echarts/core';
import { BarSeriesOption, LineSeriesOption } from 'echarts/charts';
import { TimeChartSeriesMapping } from '../model';
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
    backgroundColor: theme.palette.designSystem?.grey[800] ?? TOOLTIP_BG_COLOR_FALLBACK,
    borderRadius: '6px',
    color: '#fff',
    fontSize: '11px',
    visibility: 'visible',
    opacity: 1,
    transition: 'all 0.1s ease-out',
    // Ensure pinned tooltip shows behind edit panel drawer and sticky header
    zIndex: pinnedPos !== null ? 'auto' : theme.zIndex.tooltip,
    overflow: 'hidden',
    '&:hover': {
      overflowY: 'auto',
    },
  };
}

/**
 * Converts a timestamp value (grid coordinate) into a horizontal pixel coordinate on the chart grid.
 * @param timestamp - The timestamp value in grid coordinates
 * @param chart - The ECharts instance
 * @returns The horizontal pixel coordinate, or null if conversion fails
 */
export function getPixelXFromGrid(timestamp: number, chart: EChartsInstance): number | null {
  try {
    const pixelCoords = chart.convertToPixel('grid', [timestamp, 0]);
    return pixelCoords?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Calculates the true visual Y position for a series, accounting for stacking.
 * For stacked series, this returns the cumulative Y value (base + current series value).
 * For non-stacked series, this returns the raw Y value.
 * This function uses a stackTotals Map for O(1) lookups, ensuring O(n) overall performance.
 * @param seriesIdx - The index of the current series
 * @param yValue - The raw Y value of the current series
 * @param seriesMapping - Mapping of series indices to ECharts series options
 * @param stackTotals - Map of stackId to cumulative total (mutated by this function)
 * @returns The visual Y position accounting for stacking
 */
export function calculateVisualYForSeries(
  seriesIdx: number,
  yValue: number,
  seriesMapping: TimeChartSeriesMapping,
  stackTotals: Map<string, number>
): number {
  const currentSeries = seriesMapping[seriesIdx];
  if (!currentSeries) return yValue;

  // Check if this series is part of a stack
  const stackId = (currentSeries as LineSeriesOption | BarSeriesOption).stack;
  if (!stackId) {
    // Not stacked, return raw value
    return yValue;
  }

  // Get the current cumulative total for this stack (or 0 if not yet initialized)
  const currentTotal = stackTotals.get(stackId) ?? 0;

  // Add the current series value to the total
  const newTotal = currentTotal + yValue;

  // Update the map with the new total
  stackTotals.set(stackId, newTotal);

  // Visual Y is the new cumulative total
  return newTotal;
}

/**
 * Estimates the pixel width of a bar based on the distance to neighboring timestamps.
 * @param timestamp - The timestamp of the current bar
 * @param allTimestamps - Array of all timestamps in the dataset
 * @param chart - The ECharts instance
 * @returns The estimated bar width in pixels
 */
export function calculateBarBandwidth(timestamp: number, allTimestamps: number[], chart: EChartsInstance): number {
  // Find the closest timestamps before and after
  const sortedTimestamps = [...allTimestamps].sort((a, b) => a - b);
  const currentIdx = sortedTimestamps.indexOf(timestamp);

  if (currentIdx === -1) {
    // Fallback: use a default width
    return 20;
  }

  let prevTimestamp: number | null = null;
  let nextTimestamp: number | null = null;

  if (currentIdx > 0) {
    prevTimestamp = sortedTimestamps[currentIdx - 1] ?? null;
  }
  if (currentIdx < sortedTimestamps.length - 1) {
    nextTimestamp = sortedTimestamps[currentIdx + 1] ?? null;
  }

  // Calculate pixel positions
  const currentPixelX = getPixelXFromGrid(timestamp, chart);
  if (currentPixelX === null) return 20;

  let leftBound: number;
  let rightBound: number;

  if (prevTimestamp !== null && nextTimestamp !== null) {
    // Bar is between two other bars
    const prevPixelX = getPixelXFromGrid(prevTimestamp, chart) ?? currentPixelX;
    const nextPixelX = getPixelXFromGrid(nextTimestamp, chart) ?? currentPixelX;
    leftBound = (currentPixelX + prevPixelX) / 2;
    rightBound = (currentPixelX + nextPixelX) / 2;
  } else if (prevTimestamp !== null) {
    // First bar
    const prevPixelX = getPixelXFromGrid(prevTimestamp, chart) ?? currentPixelX;
    leftBound = (currentPixelX + prevPixelX) / 2;
    rightBound = currentPixelX + (currentPixelX - leftBound);
  } else if (nextTimestamp !== null) {
    // Last bar
    const nextPixelX = getPixelXFromGrid(nextTimestamp, chart) ?? currentPixelX;
    rightBound = (currentPixelX + nextPixelX) / 2;
    leftBound = currentPixelX - (rightBound - currentPixelX);
  } else {
    // Only one bar
    return 20; // Default width
  }

  return Math.max(1, rightBound - leftBound);
}

/**
 * Calculates the exact left and right pixel boundaries for a specific bar segment within a group.
 * For grouped bars, this accounts for the position of the bar within the group.
 * @param seriesIdx - The index of the current series
 * @param timestamp - The timestamp of the bar
 * @param allTimestamps - Array of all timestamps
 * @param totalSeries - Total number of series
 * @param chart - The ECharts instance
 * @returns Object with left and right pixel boundaries
 */
export function calculateBarSegmentBounds(
  seriesIdx: number,
  timestamp: number,
  allTimestamps: number[],
  totalSeries: number,
  chart: EChartsInstance
): { left: number; right: number } | null {
  const bandwidth = calculateBarBandwidth(timestamp, allTimestamps, chart);
  const centerPixelX = getPixelXFromGrid(timestamp, chart);
  if (centerPixelX === null) return null;

  // For grouped bars, divide the bandwidth by the number of series
  // Each bar gets a portion of the total bandwidth
  const segmentWidth = bandwidth / totalSeries;
  const segmentLeft = centerPixelX - bandwidth / 2 + seriesIdx * segmentWidth;
  const segmentRight = segmentLeft + segmentWidth;

  return {
    left: segmentLeft,
    right: segmentRight,
  };
}

/**
 * Calculates the top and bottom pixel boundaries for a bar segment.
 * This is crucial for differentiating stacked bars.
 * @param visualYBottom - The visual Y position of the bottom of the bar segment (in grid coordinates)
 * @param visualYTop - The visual Y position of the top of the bar segment (in grid coordinates)
 * @param chart - The ECharts instance
 * @returns Object with top and bottom pixel boundaries, or null if conversion fails
 */
export function calculateBarYBounds(
  visualYBottom: number,
  visualYTop: number,
  chart: EChartsInstance
): { top: number; bottom: number } | null {
  try {
    // Convert grid Y coordinates to pixel coordinates
    // Use a dummy X coordinate (0) since we only care about Y
    const bottomPixel = chart.convertToPixel('grid', [0, visualYBottom]);
    const topPixel = chart.convertToPixel('grid', [0, visualYTop]);

    if (!bottomPixel || !topPixel || bottomPixel[1] === undefined || topPixel[1] === undefined) return null;

    // In pixel coordinates, Y increases downward, so bottom has a higher Y value
    return {
      top: topPixel[1],
      bottom: bottomPixel[1],
    };
  } catch {
    return null;
  }
}
