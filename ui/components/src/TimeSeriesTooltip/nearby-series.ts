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
import { BarSeriesOption } from 'echarts/charts';
import { formatValue, TimeSeriesValueTuple, FormatOptions, TimeSeries } from '@perses-dev/core';
import { EChartsDataFormat, OPTIMIZED_MODE_SERIES_LIMIT, TimeChartSeriesMapping, DatapointInfo } from '../model';
import { batchDispatchNearbySeriesActions, getPointInGrid, getClosestTimestamp } from '../utils';
import { getPixelXFromGrid, calculateVisualYForSeries, calculateBarSegmentBounds, calculateBarYBounds } from './utils';
import { CursorCoordinates, CursorData, EMPTY_TOOLTIP_DATA } from './tooltip-model';
import { NearbySeriesArray, Candidate, IsWithinPercentageRangeParams, GetYBufferParams } from './types';

// increase multipliers to show more series in tooltip
export const INCREASE_NEARBY_SERIES_MULTIPLIER = 5.5; // adjusts how many series show in tooltip (higher == more series shown)
export const DYNAMIC_NEARBY_SERIES_MULTIPLIER = 30; // used for adjustment after series number divisor
export const SHOW_FEWER_SERIES_LIMIT = 5;

/**
 * Gathers all candidate series that could match the cursor position.
 * This is Pass 1 of the two-pass system.
 */
function gatherCandidates(
  data: TimeSeries[],
  seriesMapping: TimeChartSeriesMapping,
  closestTimestamp: number,
  cursorX: number,
  cursorY: number,
  cursorXPixel: number | null,
  yBuffer: number,
  chart: EChartsInstance,
  selectedSeriesIdx?: number | null
): Candidate[] {
  const candidates: Candidate[] = [];
  const totalSeries = data.length;

  // Initialize stack totals map for O(n) performance
  const stackTotals = new Map<string, number>();

  // Collect all timestamps for bar chart calculations
  const allTimestamps: number[] = [];
  if (data[0]?.values) {
    for (const [timestamp] of data[0].values) {
      if (!allTimestamps.includes(timestamp)) {
        allTimestamps.push(timestamp);
      }
    }
  }

  for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
    const currentSeries = seriesMapping[seriesIdx];
    if (!currentSeries) continue;

    const currentDataset = data[seriesIdx];
    if (!currentDataset) continue;

    const currentDatasetValues: TimeSeriesValueTuple[] = currentDataset.values;
    if (!currentDatasetValues || !Array.isArray(currentDatasetValues)) continue;

    const seriesType = currentSeries.type ?? 'line';
    const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
    const markerColor = currentSeries.color ?? '#000';

    // Find the data point at the closest timestamp
    const datumAtTimestamp = currentDatasetValues.find(([ts]) => ts === closestTimestamp);
    if (!datumAtTimestamp) continue;

    const xValue = datumAtTimestamp[0];
    const yValue = datumAtTimestamp[1];

    // Skip null/undefined values
    if (yValue === null || yValue === undefined) continue;

    let isCandidate = false;
    let visualY = yValue;
    let distance = Infinity;

    if (seriesType === 'line') {
      // For line series: calculate visual Y (accounting for stacking) and check vertical proximity
      visualY = calculateVisualYForSeries(seriesIdx, yValue, seriesMapping, stackTotals);
      const verticalDistance = Math.abs(visualY - cursorY);
      isCandidate = verticalDistance <= yBuffer;
      distance = verticalDistance;
    } else if (seriesType === 'bar') {
      // For bar series: X-axis dominant hit test
      if (cursorXPixel === null) continue;

      const segmentBounds = calculateBarSegmentBounds(seriesIdx, closestTimestamp, allTimestamps, totalSeries, chart);
      if (!segmentBounds) continue;

      // Check if cursor X is within the bar's horizontal bounds
      const isWithinXBounds = cursorXPixel >= segmentBounds.left && cursorXPixel <= segmentBounds.right;

      if (!isWithinXBounds) continue;

      // For stacked bars, also check Y bounds
      const stackId = (currentSeries as BarSeriesOption).stack;
      let isHoveringYBounds = true;

      if (stackId) {
        // This is a stacked bar, check Y bounds
        // Calculate the visual Y position of the bottom of this bar segment
        // For the bottom, we need the cumulative total before this series
        const stackIdStr = stackId.toString();
        const visualYBottom = stackTotals.get(stackIdStr) ?? 0;
        // Calculate the visual Y position of the top of this bar segment
        visualY = calculateVisualYForSeries(seriesIdx, yValue, seriesMapping, stackTotals);
        const yBounds = calculateBarYBounds(visualYBottom, visualY, chart);

        if (yBounds) {
          // Convert cursor Y from grid coordinates to pixel for comparison
          const cursorYPixel = chart.convertToPixel('grid', [0, cursorY]);
          if (cursorYPixel && cursorYPixel[1] !== undefined) {
            isHoveringYBounds = cursorYPixel[1] >= yBounds.top && cursorYPixel[1] <= yBounds.bottom;
          }
        }
      } else {
        // For non-stacked bars, always pass Y bounds check (accessibility fix for low-value bars)
        // Visual Y is just the raw value
        visualY = yValue;
      }

      if (!isHoveringYBounds) continue;

      // Distance for bars is horizontal distance from cursor to center of bar segment
      const segmentCenter = (segmentBounds.left + segmentBounds.right) / 2;
      distance = Math.abs(cursorXPixel - segmentCenter);
      isCandidate = true;
    }

    if (isCandidate) {
      const datumIdx = currentDatasetValues.findIndex(([ts]) => ts === closestTimestamp);
      const isSelected =
        selectedSeriesIdx !== null && selectedSeriesIdx !== undefined && seriesIdx === selectedSeriesIdx;
      candidates.push({
        seriesIdx,
        datumIdx,
        seriesName: currentSeriesName,
        date: closestTimestamp,
        markerColor: markerColor.toString(),
        x: xValue,
        y: yValue,
        formattedY: '', // Will be filled in processCandidates
        visualY,
        distance,
        isSelected,
      });
    }
  }

  return candidates;
}

/**
 * Finds the candidate with the minimum distance to the cursor.
 * This is Pass 2 of the two-pass system - selecting the winner.
 */
function findClosestCandidate(candidates: Candidate[]): Candidate | null {
  if (candidates.length === 0) return null;

  const firstCandidate = candidates[0];
  if (!firstCandidate) return null;

  let winner = firstCandidate;
  for (let i = 1; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (candidate && candidate.distance < winner.distance) {
      winner = candidate;
    }
  }

  return winner;
}

/**
 * Processes candidates into the final NearbySeriesArray format and handles ECharts actions.
 */
function processCandidates(
  candidates: Candidate[],
  winner: Candidate | null,
  format: FormatOptions | undefined,
  chart: EChartsInstance
): NearbySeriesArray {
  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const emphasizedDatapoints: DatapointInfo[] = [];
  const duplicateDatapoints: DatapointInfo[] = [];
  const yValueCounts: Map<number, number> = new Map();

  const result: NearbySeriesArray = [];

  for (const candidate of candidates) {
    const formattedY = formatValue(candidate.y, format);
    const isClosestToCursor = winner !== null && candidate.seriesIdx === winner.seriesIdx;

    // Determine if this should be emphasized (bold in tooltip)
    // Only emphasize the winner (closest to cursor)
    const shouldEmphasize = isClosestToCursor;

    if (shouldEmphasize) {
      emphasizedSeriesIndexes.push(candidate.seriesIdx);
      const duplicateValuesCount = yValueCounts.get(candidate.y) ?? 0;
      yValueCounts.set(candidate.y, duplicateValuesCount + 1);
      if (duplicateValuesCount > 0) {
        duplicateDatapoints.push({
          seriesIndex: candidate.seriesIdx,
          dataIndex: candidate.datumIdx,
          seriesName: candidate.seriesName,
          yValue: candidate.y,
        });
      }
      emphasizedDatapoints.push({
        seriesIndex: candidate.seriesIdx,
        dataIndex: candidate.datumIdx,
        seriesName: candidate.seriesName,
        yValue: candidate.y,
      });
    } else {
      nonEmphasizedSeriesIndexes.push(candidate.seriesIdx);
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: candidate.seriesIdx,
      });
    }

    result.push({
      seriesIdx: candidate.seriesIdx,
      datumIdx: candidate.datumIdx,
      seriesName: candidate.seriesName,
      date: candidate.date,
      x: candidate.x,
      y: candidate.y,
      formattedY,
      markerColor: candidate.markerColor,
      isClosestToCursor,
      isSelected: candidate.isSelected,
    });

    nearbySeriesIndexes.push(candidate.seriesIdx);
  }

  batchDispatchNearbySeriesActions(
    chart,
    nearbySeriesIndexes,
    emphasizedSeriesIndexes,
    nonEmphasizedSeriesIndexes,
    emphasizedDatapoints,
    duplicateDatapoints
  );

  return result;
}

/**
 * Returns formatted series data for the points that are close to the user's cursor.
 * Uses a two-pass "gather and select" system for improved accuracy with stacked and bar charts.
 */
export function checkforNearbyTimeSeries(
  data: TimeSeries[],
  seriesMapping: TimeChartSeriesMapping,
  pointInGrid: number[],
  yBuffer: number,
  chart: EChartsInstance,
  format?: FormatOptions,
  cursorXPixel?: number | null,
  selectedSeriesIdx?: number | null
): NearbySeriesArray {
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) return EMPTY_TOOLTIP_DATA;

  if (chart.dispatchAction === undefined) return EMPTY_TOOLTIP_DATA;

  if (!Array.isArray(data)) return EMPTY_TOOLTIP_DATA;

  // Only need to loop through first dataset source since getCommonTimeScale ensures xAxis timestamps are consistent
  const firstTimeSeriesValues = data[0]?.values;
  const closestTimestamp = getClosestTimestamp(firstTimeSeriesValues, cursorX);

  if (closestTimestamp === null) {
    return EMPTY_TOOLTIP_DATA;
  }

  // Convert cursor X to pixel if not provided
  const cursorXPixelValue = cursorXPixel ?? getPixelXFromGrid(closestTimestamp, chart);

  // Pass 1: Gather all candidates
  const candidates = gatherCandidates(
    data,
    seriesMapping,
    closestTimestamp,
    cursorX,
    cursorY,
    cursorXPixelValue,
    yBuffer,
    chart,
    selectedSeriesIdx
  );

  // Pass 2: Find the closest candidate (winner)
  const winner = findClosestCandidate(candidates);

  // Process candidates into final format and handle ECharts actions
  return processCandidates(candidates, winner, format, chart);
}

/**
 * [DEPRECATED] Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function legacyCheckforNearbySeries(
  data: EChartsDataFormat,
  pointInGrid: number[],
  yBuffer: number,
  chart?: EChartsInstance,
  format?: FormatOptions
): NearbySeriesArray {
  const currentNearbySeriesData: NearbySeriesArray = [];
  const cursorX: number | null = pointInGrid[0] ?? null;
  const cursorY: number | null = pointInGrid[1] ?? null;

  if (cursorX === null || cursorY === null) {
    return currentNearbySeriesData;
  }

  const nearbySeriesIndexes: number[] = [];
  const emphasizedSeriesIndexes: number[] = [];
  const nonEmphasizedSeriesIndexes: number[] = [];
  const totalSeries = data.timeSeries.length;
  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < totalSeries; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentSeries === undefined) break;
      if (currentNearbySeriesData.length >= OPTIMIZED_MODE_SERIES_LIMIT) break;

      const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
      const markerColor = currentSeries.color ?? '#000';
      if (Array.isArray(currentSeries.data)) {
        for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
          const xValue = data.xAxis[datumIdx] ?? 0;
          const yValue = currentSeries.data[datumIdx];
          // ensure null values not displayed in tooltip
          if (yValue !== undefined && yValue !== null && cursorX === datumIdx) {
            if (yValue !== '-' && cursorY <= yValue + yBuffer && cursorY >= yValue - yBuffer) {
              // show fewer bold series in tooltip when many total series
              const minPercentRange = totalSeries > SHOW_FEWER_SERIES_LIMIT ? 2 : 5;
              const percentRangeToCheck = Math.max(minPercentRange, 100 / totalSeries);
              const isClosestToCursor = isWithinPercentageRange({
                valueToCheck: cursorY,
                baseValue: yValue,
                percentage: percentRangeToCheck,
              });
              if (isClosestToCursor) {
                emphasizedSeriesIndexes.push(seriesIdx);
              } else {
                nonEmphasizedSeriesIndexes.push(seriesIdx);
                // ensure series not close to cursor are not highlighted
                if (chart?.dispatchAction !== undefined) {
                  chart.dispatchAction({
                    type: 'downplay',
                    seriesIndex: seriesIdx,
                  });
                }
              }

              // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
              const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
              const formattedY = formatValue(yValue, format);
              currentNearbySeriesData.push({
                seriesIdx: seriesIdx,
                datumIdx: datumIdx,
                seriesName: currentSeriesName,
                date: xValueMilliSeconds,
                x: xValue,
                y: yValue,
                formattedY: formattedY,
                markerColor: markerColor.toString(),
                isClosestToCursor,
              });
              nearbySeriesIndexes.push(seriesIdx);
            }
          }
        }
      }
    }
  }
  if (chart?.dispatchAction !== undefined) {
    // Clears emphasis state of all lines that are not emphasized.
    // Emphasized is a subset of just the nearby series that are closest to cursor.
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: nonEmphasizedSeriesIndexes,
    });

    // https://echarts.apache.org/en/api.html#action.highlight
    if (emphasizedSeriesIndexes.length > 0) {
      // Fadeout opacity of all series not closest to cursor.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: emphasizedSeriesIndexes,
        notBlur: false, // ensure blur IS triggered, this is default but setting so it is explicit
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    } else {
      // When no emphasized series with bold text, notBlur allows opacity fadeout to not trigger.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: nearbySeriesIndexes,
        notBlur: true, // do not trigger blur state when cursor is not immediately close to any series
        escapeConnect: true, // shared crosshair should not emphasize series on adjacent charts
      });
    }
  }

  return currentNearbySeriesData;
}

/**
 * Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all nearby series
 */
export function getNearbySeriesData({
  mousePos,
  pinnedPos,
  data,
  seriesMapping,
  chart,
  format,
  showAllSeries = false,
  selectedSeriesIdx,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorCoordinates | null;
  data: TimeSeries[];
  seriesMapping: TimeChartSeriesMapping;
  chart?: EChartsInstance;
  format?: FormatOptions;
  showAllSeries?: boolean;
  selectedSeriesIdx?: number | null;
}): NearbySeriesArray {
  if (chart === undefined || mousePos === null) return EMPTY_TOOLTIP_DATA;

  // prevents multiple tooltips showing from adjacent charts unless tooltip is pinned
  let cursorTargetMatchesChart = false;
  if (mousePos.target !== null) {
    const currentParent = (<HTMLElement>mousePos.target).parentElement;
    if (currentParent !== null) {
      const currentGrandparent = currentParent.parentElement;
      if (currentGrandparent !== null) {
        const chartDom = chart.getDom();
        if (chartDom === currentGrandparent) {
          cursorTargetMatchesChart = true;
        }
      }
    }
  }

  // allows moving cursor inside tooltip without it fading away
  if (pinnedPos !== null) {
    mousePos = pinnedPos;
    cursorTargetMatchesChart = true;
  }

  if (cursorTargetMatchesChart === false || data === null || chart['_model'] === undefined) return EMPTY_TOOLTIP_DATA;

  // mousemove position undefined when not hovering over chart canvas
  if (mousePos.plotCanvas.x === undefined || mousePos.plotCanvas.y === undefined) return EMPTY_TOOLTIP_DATA;

  const pointInGrid = getPointInGrid(mousePos.plotCanvas.x, mousePos.plotCanvas.y, chart);
  if (pointInGrid !== null) {
    const chartModel = chart['_model'];
    const yInterval = chartModel.getComponent('yAxis').axis.scale._interval;
    const totalSeries = data.length;
    const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });
    // Pass cursor pixel X coordinate for bar chart hit testing
    const cursorXPixel = mousePos.plotCanvas.x ?? null;
    return checkforNearbyTimeSeries(
      data,
      seriesMapping,
      pointInGrid,
      yBuffer,
      chart,
      format,
      cursorXPixel,
      selectedSeriesIdx
    );
  }

  // no nearby series found
  return EMPTY_TOOLTIP_DATA;
}

/**
 * [DEPRECATED] Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all nearby series
 */
export function legacyGetNearbySeriesData({
  mousePos,
  pinnedPos,
  chartData,
  chart,
  format,
  showAllSeries = false,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorCoordinates | null;
  chartData: EChartsDataFormat;
  chart?: EChartsInstance;
  format?: FormatOptions;
  showAllSeries?: boolean;
}): NearbySeriesArray {
  if (chart === undefined || mousePos === null) return [];

  // prevents multiple tooltips showing from adjacent charts unless tooltip is pinned
  let cursorTargetMatchesChart = false;
  if (mousePos.target !== null) {
    const currentParent = (<HTMLElement>mousePos.target).parentElement;
    if (currentParent !== null) {
      const currentGrandparent = currentParent.parentElement;
      if (currentGrandparent !== null) {
        const chartDom = chart.getDom();
        if (chartDom === currentGrandparent) {
          cursorTargetMatchesChart = true;
        }
      }
    }
  }

  // allows moving cursor inside tooltip without it fading away
  if (pinnedPos !== null) {
    mousePos = pinnedPos;
    cursorTargetMatchesChart = true;
  }

  if (cursorTargetMatchesChart === false) return [];

  if (chart['_model'] === undefined) return [];
  const chartModel = chart['_model'];
  const yInterval = chartModel.getComponent('yAxis').axis.scale._interval;
  const totalSeries = chartData.timeSeries.length;
  const yBuffer = getYBuffer({ yInterval, totalSeries, showAllSeries });
  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return legacyCheckforNearbySeries(chartData, pointInGrid, yBuffer, chart, format);
    }
  }

  return [];
}

/*
 * Check if two numbers are within a specified percentage range
 */
export function isWithinPercentageRange({
  valueToCheck,
  baseValue,
  percentage,
}: IsWithinPercentageRangeParams): boolean {
  const range = (percentage / 100) * baseValue;
  const lowerBound = baseValue - range;
  const upperBound = baseValue + range;
  return valueToCheck >= lowerBound && valueToCheck <= upperBound;
}

/*
 * Get range to check within for nearby series to show in tooltip.
 */
export function getYBuffer({ yInterval, totalSeries, showAllSeries = false }: GetYBufferParams): number {
  if (showAllSeries) {
    return yInterval * 10; // roughly correlates with grid so entire canvas is searched
  }

  // never let nearby series range be less than roughly the size of a single tick
  const yBufferMin = yInterval * 0.3;

  // tooltip trigger area gets smaller with more series
  if (totalSeries > SHOW_FEWER_SERIES_LIMIT) {
    const adjustedBuffer = (yInterval * DYNAMIC_NEARBY_SERIES_MULTIPLIER) / totalSeries;
    return Math.max(yBufferMin, adjustedBuffer);
  }

  // increase multiplier to expand nearby series range
  return Math.max(yBufferMin, yInterval * INCREASE_NEARBY_SERIES_MULTIPLIER);
}
