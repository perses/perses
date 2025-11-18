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

import { ECharts as EChartsInstance } from 'echarts/core';
import { Theme } from '@mui/material';
import { formatValue, TimeSeries, TimeSeriesMetadata, FormatOptions } from '@perses-dev/core';
import { LineSeriesOption, BarSeriesOption } from 'echarts/charts';
import { DatapointInfo, TimeChartSeriesMapping, TimeSeriesOption } from '../model';
import {
  CursorCoordinates,
  CursorData,
  TOOLTIP_MAX_WIDTH,
  TOOLTIP_MAX_HEIGHT,
  TOOLTIP_MIN_WIDTH,
  TOOLTIP_BG_COLOR_FALLBACK,
  TOOLTIP_PADDING,
} from './tooltip-model';
import {
  CalculateBarBandwidthParams,
  CalculateBarSegmentBoundsParams,
  CalculateBarYBoundsParams,
  CalculateVisualYForSeriesParams,
  BarSegmentBounds,
  BarYBounds,
  Candidate,
  NearbySeriesArray,
} from './types';

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
    // LOGZ.IO CHANGE START:: Custom Drilldown preview [APPZ-709]
    // Ensure pinned tooltip shows on top of all content, especially in panel editor
    zIndex: pinnedPos !== null ? theme.zIndex.modal + 1 : theme.zIndex.tooltip,
    // LOGZ.IO CHANGE END:: Custom Drilldown preview [APPZ-709]
    overflow: 'hidden',
    '&:hover': {
      overflowY: 'auto',
    },
  };
}

// LOGZ.IO CHANGE START:: Tooltip is not behaving correctly [APPZ-1418]

export function getPixelXFromGrid(chart: EChartsInstance, xValue: number): number {
  const pixelValue = chart.convertToPixel('grid', [xValue, 0]);
  return pixelValue[0] ?? 0;
}

export function calculateVisualYForSeries({ rawY, stackId, stackTotals }: CalculateVisualYForSeriesParams): number {
  if (stackId === undefined) {
    return rawY;
  }

  const currentStackTotal = stackTotals.get(stackId) ?? 0;
  const visualY = currentStackTotal + rawY;
  stackTotals.set(stackId, visualY);

  return visualY;
}

export function calculateBarBandwidth({
  timestampCenterX,
  prevTimestamp,
  nextTimestamp,
  chart,
  defaultBandwidth = 20,
}: CalculateBarBandwidthParams): number {
  const hasLeftNeighbor = prevTimestamp !== undefined;
  const hasRightNeighbor = nextTimestamp !== undefined;

  if (!hasLeftNeighbor && !hasRightNeighbor) {
    return defaultBandwidth;
  }

  let leftTimestampX: number | null = null;
  let rightTimestampX: number | null = null;

  if (hasLeftNeighbor) {
    leftTimestampX = getPixelXFromGrid(chart, prevTimestamp);
  }

  if (hasRightNeighbor) {
    rightTimestampX = getPixelXFromGrid(chart, nextTimestamp);
  }

  if (leftTimestampX !== null && rightTimestampX !== null) {
    const distanceToLeft = Math.abs(timestampCenterX - leftTimestampX);
    const distanceToRight = Math.abs(rightTimestampX - timestampCenterX);
    return Math.min(distanceToLeft, distanceToRight);
  }

  if (leftTimestampX !== null) {
    return Math.abs(timestampCenterX - leftTimestampX);
  }

  if (rightTimestampX !== null) {
    return Math.abs(rightTimestampX - timestampCenterX);
  }

  return defaultBandwidth;
}

export function calculateBarSegmentBounds({
  timestampCenterX,
  bandwidth,
  seriesIdx,
  barSeriesOrder,
}: CalculateBarSegmentBoundsParams): BarSegmentBounds {
  const groupLeft = timestampCenterX - bandwidth / 2;
  const barsInGroup = barSeriesOrder.length || 1;
  const idxInBars = Math.max(0, barSeriesOrder.indexOf(seriesIdx));
  const segmentWidth = bandwidth / barsInGroup;
  const segLeft = groupLeft + idxInBars * segmentWidth;
  const segRight = segLeft + segmentWidth;

  return { segLeft, segRight };
}

export function calculateBarYBounds({ visualY, rawY, isStacked }: CalculateBarYBoundsParams): BarYBounds {
  const base = isStacked ? visualY - rawY : 0;
  const lower = Math.min(base, visualY);
  const upper = Math.max(base, visualY);

  return { base, lower, upper };
}

/**
 * Creates candidates for all series at a given timestamp when hovering over a bar chart.
 * This function is responsible for building the complete list of candidates for bar group tooltips.
 */
export function createBarGroupCandidates({
  data,
  seriesMapping,
  closestTimestamp,
  hoveredBarInfo,
  selectedSeriesIdx,
  seriesMetadata,
  timestampIdx,
}: {
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  closestTimestamp: number;
  hoveredBarInfo: { seriesIdx: number; distance: number };
  selectedSeriesIdx?: number | null;
  seriesMetadata?: TimeSeriesMetadata[];
  timestampIdx: number;
}): Candidate[] {
  const candidates: Candidate[] = [];
  const totalSeries = data.length;
  const stackTotals = new Map<string, number>();

  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    const hasCurrentSeries = currentSeries !== undefined;

    if (hasCurrentSeries) {
      const currentDataset = data[seriesIdx];
      const hasValidDataset = currentDataset !== undefined && currentDataset !== null;
      const hasDatasetValues = currentDataset?.values !== undefined && currentDataset?.values !== null;

      if (hasValidDataset && hasDatasetValues && timestampIdx < currentDataset.values.length) {
        const datumAtTimestamp = currentDataset.values[timestampIdx];
        const hasDatumAtTimestamp = datumAtTimestamp !== undefined && datumAtTimestamp[0] === closestTimestamp;

        if (hasDatumAtTimestamp) {
          const [xValue, yValue] = datumAtTimestamp;
          const hasValidYValue = yValue !== null && yValue !== undefined;

          if (hasValidYValue) {
            const hasSelectedSeriesIdx = selectedSeriesIdx !== null && selectedSeriesIdx !== undefined;
            const isSelected = hasSelectedSeriesIdx && seriesIdx === selectedSeriesIdx;

            let distance: number;
            if (seriesIdx === hoveredBarInfo.seriesIdx) {
              distance = hoveredBarInfo.distance;
            } else {
              distance = Infinity;
            }

            const stackId = (currentSeries as LineSeriesOption | BarSeriesOption).stack;
            const visualY = calculateVisualYForSeries({
              rawY: yValue,
              stackId,
              stackTotals,
            });

            const currentMetadata = seriesMetadata?.[seriesIdx];

            let seriesName: string;
            if (currentSeries.name !== undefined) {
              seriesName = String(currentSeries.name);
            } else {
              seriesName = '';
            }

            let markerColor: string;
            if (currentSeries.color !== undefined) {
              markerColor = String(currentSeries.color);
            } else {
              markerColor = '#000';
            }

            candidates.push({
              seriesIdx,
              datumIdx: timestampIdx,
              seriesName,
              date: closestTimestamp,
              markerColor,
              x: xValue,
              y: yValue,
              formattedY: '',
              visualY,
              distance,
              isSelected,
              metadata: currentMetadata,
            });
          }
        }
      }
    }
  }

  return candidates;
}

export function findClosestCandidate(candidates: Candidate[]): Candidate {
  if (candidates.length === 0) {
    throw new Error('Cannot find closest candidate in an empty array.');
  }

  let winnerIdx = 0;
  let minDistance = candidates[0]!.distance;

  for (let i = 1; i < candidates.length; i++) {
    const candidateDistance = candidates[i]!.distance;
    const isCloserThanCurrentWinner = candidateDistance < minDistance;

    if (isCloserThanCurrentWinner) {
      minDistance = candidateDistance;
      winnerIdx = i;
    }
  }

  return candidates[winnerIdx]!;
}

/**
 * Gathers all candidate series that could match the cursor position.
 * This is Pass 1 of the two-pass system.
 * Uses a "detect, then build" pattern: detects bar hover in a single pass,
 * then builds appropriate candidates (bar group or line series).
 */
export function gatherCandidates({
  data,
  seriesMapping,
  closestTimestamp,
  cursorY,
  yBuffer,
  chart,
  mousePixelX,
  seriesMetadata,
  selectedSeriesIdx,
}: {
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  closestTimestamp: number;
  cursorY: number;
  yBuffer: number;
  chart: EChartsInstance;
  mousePixelX?: number;
  seriesMetadata?: TimeSeriesMetadata[];
  selectedSeriesIdx?: number | null;
}): Candidate[] {
  const lineCandidates: Candidate[] = [];
  const totalSeries = data.length;
  const stackTotals = new Map<string, number>();

  let hoveredBarInfo: { seriesIdx: number; distance: number } | null = null;

  const isBarSeries = (option: TimeSeriesOption | undefined): option is BarSeriesOption => option?.type === 'bar';
  const isStackedBarMode = seriesMapping.some((series) => isBarSeries(series) && series.stack === 'all');

  const firstTimeSeriesValues = data[0]?.values;
  const timestampIdx = firstTimeSeriesValues?.findIndex(([ts]) => ts === closestTimestamp) ?? -1;

  if (isStackedBarMode) {
    if (timestampIdx === -1) {
      return lineCandidates;
    }

    let cumulativePositiveY = 0;
    let cumulativeNegativeY = 0;
    let selectedSeriesIdxForStack: number | null = null;

    for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
      const currentSeries = seriesMapping[seriesIdx];
      if (!isBarSeries(currentSeries)) continue;

      const currentDataset = data[seriesIdx];
      if (!currentDataset?.values || timestampIdx >= currentDataset.values.length) continue;

      const datumAtTimestamp = currentDataset.values[timestampIdx];
      if (!datumAtTimestamp || datumAtTimestamp[0] !== closestTimestamp) continue;

      const yValue = datumAtTimestamp[1];
      if (typeof yValue !== 'number') continue;

      let segmentStartY: number;
      let segmentEndY: number;
      if (yValue >= 0) {
        segmentStartY = cumulativePositiveY;
        segmentEndY = cumulativePositiveY + yValue;
        cumulativePositiveY = segmentEndY;
      } else {
        segmentStartY = cumulativeNegativeY + yValue;
        segmentEndY = cumulativeNegativeY;
        cumulativeNegativeY = segmentStartY;
      }

      const segmentMinY = Math.min(segmentStartY, segmentEndY);
      const segmentMaxY = Math.max(segmentStartY, segmentEndY);

      if (cursorY >= segmentMinY && cursorY <= segmentMaxY) {
        selectedSeriesIdxForStack = seriesIdx;
        break;
      }
    }

    if (selectedSeriesIdxForStack !== null && mousePixelX !== undefined) {
      const selectedDataset = data[selectedSeriesIdxForStack];
      if (selectedDataset?.values && timestampIdx < selectedDataset.values.length) {
        const datumAtTimestamp = selectedDataset.values[timestampIdx];
        if (datumAtTimestamp && datumAtTimestamp[0] === closestTimestamp) {
          const [xValue] = datumAtTimestamp;
          const timestampCenterX = getPixelXFromGrid(chart, xValue);

          let prevTimestamp: number | undefined;
          if (timestampIdx > 0) {
            prevTimestamp = firstTimeSeriesValues?.[timestampIdx - 1]?.[0];
          }

          let nextTimestamp: number | undefined;
          const firstTimeSeriesLength = firstTimeSeriesValues?.length ?? 0;
          if (timestampIdx < firstTimeSeriesLength - 1) {
            nextTimestamp = firstTimeSeriesValues?.[timestampIdx + 1]?.[0];
          }

          const bandwidth = calculateBarBandwidth({
            timestampCenterX,
            prevTimestamp,
            nextTimestamp,
            chart,
          });

          const groupLeft = timestampCenterX - bandwidth / 2;
          const groupRight = timestampCenterX + bandwidth / 2;
          const isWithinXBounds = mousePixelX >= groupLeft && mousePixelX <= groupRight;

          if (isWithinXBounds) {
            const distance = Math.abs(mousePixelX - timestampCenterX);
            hoveredBarInfo = { seriesIdx: selectedSeriesIdxForStack, distance };
          }
        }
      }
    }
  }

  const barSeriesOrder: number[] = isStackedBarMode
    ? []
    : seriesMapping.reduce((acc: number[], series, idx) => {
        if ((series as { type?: string }).type === 'bar') acc.push(idx);
        return acc;
      }, []);

  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    const hasCurrentSeries = currentSeries !== undefined;

    if (hasCurrentSeries) {
      const currentDataset = data[seriesIdx];
      const hasValidDataset = currentDataset !== undefined && currentDataset !== null;
      const hasDatasetValues = currentDataset?.values !== undefined && currentDataset?.values !== null;

      if (hasValidDataset && hasDatasetValues) {
        const datumAtTimestamp = currentDataset.values.find(([ts]) => ts === closestTimestamp);
        const hasDatumAtTimestamp = datumAtTimestamp !== undefined;

        if (hasDatumAtTimestamp) {
          const [xValue, yValue] = datumAtTimestamp;
          const hasValidYValue = yValue !== null && yValue !== undefined;

          if (hasValidYValue) {
            let seriesType: string;
            if (currentSeries.type !== undefined) {
              seriesType = currentSeries.type;
            } else {
              seriesType = 'line';
            }
            const currentMetadata = seriesMetadata?.[seriesIdx];

            let currentSeriesName: string;
            if (currentSeries.name !== undefined) {
              currentSeriesName = String(currentSeries.name);
            } else {
              currentSeriesName = '';
            }

            let markerColor: string;
            if (currentSeries.color !== undefined) {
              markerColor = String(currentSeries.color);
            } else {
              markerColor = '#000';
            }

            if (seriesType === 'line') {
              const stackId = (currentSeries as LineSeriesOption).stack;
              const visualY = calculateVisualYForSeries({
                rawY: yValue,
                stackId,
                stackTotals,
              });

              const verticalDistance = Math.abs(visualY - cursorY);
              const isWithinYBuffer = verticalDistance <= yBuffer;

              if (isWithinYBuffer) {
                const datumIdx = currentDataset.values.findIndex(([ts]) => ts === closestTimestamp);
                const hasSelectedSeriesIdx = selectedSeriesIdx !== null && selectedSeriesIdx !== undefined;
                const isSelected = hasSelectedSeriesIdx && seriesIdx === selectedSeriesIdx;

                lineCandidates.push({
                  seriesIdx,
                  datumIdx,
                  seriesName: currentSeriesName,
                  date: closestTimestamp,
                  markerColor,
                  x: xValue,
                  y: yValue,
                  formattedY: '',
                  visualY,
                  distance: verticalDistance,
                  isSelected,
                  metadata: currentMetadata,
                });
              }
            } else if (seriesType === 'bar' && !isStackedBarMode) {
              const hasValidMousePixelX = mousePixelX !== undefined;

              if (hasValidMousePixelX) {
                const timestampIdx = firstTimeSeriesValues?.findIndex(([ts]) => ts === closestTimestamp) ?? -1;

                let prevTimestamp: number | undefined;
                if (timestampIdx > 0) {
                  prevTimestamp = firstTimeSeriesValues?.[timestampIdx - 1]?.[0];
                } else {
                  prevTimestamp = undefined;
                }

                let nextTimestamp: number | undefined;
                const firstTimeSeriesLength = firstTimeSeriesValues?.length ?? 0;
                const isValidTimestampIdx = timestampIdx >= 0;
                const hasNextTimestamp = timestampIdx < firstTimeSeriesLength - 1;

                if (isValidTimestampIdx && hasNextTimestamp) {
                  nextTimestamp = firstTimeSeriesValues?.[timestampIdx + 1]?.[0];
                } else {
                  nextTimestamp = undefined;
                }

                const timestampCenterX = getPixelXFromGrid(chart, xValue);

                const bandwidth = calculateBarBandwidth({
                  timestampCenterX,
                  prevTimestamp,
                  nextTimestamp,
                  chart,
                });

                const { segLeft, segRight } = calculateBarSegmentBounds({
                  timestampCenterX,
                  bandwidth,
                  seriesIdx,
                  barSeriesOrder,
                });

                const isWithinXBounds = mousePixelX >= segLeft && mousePixelX <= segRight;

                if (isWithinXBounds) {
                  const stackId = (currentSeries as BarSeriesOption).stack;
                  const hasStackId = stackId !== undefined;
                  let isHoveringYBounds = true;

                  if (hasStackId) {
                    const visualY = calculateVisualYForSeries({ rawY: yValue, stackId, stackTotals });
                    const { lower, upper } = calculateBarYBounds({
                      visualY,
                      rawY: yValue,
                      isStacked: true,
                    });
                    isHoveringYBounds = cursorY >= lower && cursorY <= upper;
                  }

                  if (isHoveringYBounds) {
                    const segmentCenter = (segLeft + segRight) / 2;
                    const distance = Math.abs(mousePixelX - segmentCenter);

                    const isFirstHoveredBar = hoveredBarInfo === null;
                    const isCloserThanCurrentHoveredBar = hoveredBarInfo !== null && distance < hoveredBarInfo.distance;

                    if (isFirstHoveredBar || isCloserThanCurrentHoveredBar) {
                      hoveredBarInfo = { seriesIdx, distance };
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  if (hoveredBarInfo !== null) {
    const effectiveSelectedSeriesIdx = isStackedBarMode ? hoveredBarInfo.seriesIdx : selectedSeriesIdx;
    return createBarGroupCandidates({
      data,
      seriesMapping,
      closestTimestamp,
      hoveredBarInfo,
      selectedSeriesIdx: effectiveSelectedSeriesIdx,
      seriesMetadata,
      timestampIdx,
    });
  }

  return lineCandidates;
}

/**
 * Processes a list of candidates to determine which series to emphasize and formats them for the tooltip.
 */
export function processCandidates(
  candidates: Candidate[],
  winner: Candidate,
  format?: FormatOptions
): {
  currentNearbySeriesData: NearbySeriesArray;
  emphasizedSeriesIndexes: number[];
  nonEmphasizedSeriesIndexes: number[];
  emphasizedDatapoints: DatapointInfo[];
  duplicateDatapoints: DatapointInfo[];
  nearbySeriesIndexes: number[];
} {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const emphasizedDatapoints: DatapointInfo[] = [];
  const duplicateDatapoints: DatapointInfo[] = [];
  const nearbySeriesIndexes: number[] = candidates.map((c) => c.seriesIdx);
  const yValueCounts: Map<number, number> = new Map();

  for (const candidate of candidates) {
    const isClosestToCursor = candidate === winner;
    const formattedY = formatValue(candidate.y, format);

    if (isClosestToCursor) {
      emphasizedSeriesIndexes.push(candidate.seriesIdx);

      const duplicateValuesCount = yValueCounts.get(candidate.visualY) ?? 0;
      const hasDuplicateValues = duplicateValuesCount > 0;
      yValueCounts.set(candidate.visualY, duplicateValuesCount + 1);

      if (hasDuplicateValues) {
        duplicateDatapoints.push({
          seriesIndex: candidate.seriesIdx,
          dataIndex: candidate.datumIdx,
          seriesName: candidate.seriesName,
          yValue: candidate.visualY,
        });
      }

      emphasizedDatapoints.push({
        seriesIndex: candidate.seriesIdx,
        dataIndex: candidate.datumIdx,
        seriesName: candidate.seriesName,
        yValue: candidate.visualY,
      });
    } else {
      nonEmphasizedSeriesIndexes.push(candidate.seriesIdx);
    }

    currentNearbySeriesData.push({
      seriesIdx: candidate.seriesIdx,
      datumIdx: candidate.datumIdx,
      seriesName: candidate.seriesName,
      date: candidate.date,
      x: candidate.x,
      y: candidate.y,
      formattedY,
      markerColor: candidate.markerColor,
      isClosestToCursor,
      metadata: candidate.metadata,
      isSelected: candidate.isSelected,
    });
  }

  return {
    currentNearbySeriesData,
    emphasizedSeriesIndexes,
    nonEmphasizedSeriesIndexes,
    emphasizedDatapoints,
    duplicateDatapoints,
    nearbySeriesIndexes,
  };
}

// LOGZ.IO CHANGE END:: Tooltip is not behaving correctly [APPZ-1418]
