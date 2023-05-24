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
import { formatValue, UnitOptions, EChartsDataFormat, OPTIMIZED_MODE_SERIES_LIMIT } from '../model';
import { CursorData } from './tooltip-model';

// increase multipliers to show more series in tooltip
export const INCREASE_NEARBY_SERIES_MULTIPLIER = 5.5; // adjusts how many series show in tooltip (higher == more series shown)
export const DYNAMIC_NEARBY_SERIES_MULTIPLIER = 30; // used for adjustment after series number divisor
export const SHOW_FEWER_SERIES_LIMIT = 5;

export interface NearbySeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
  isClosestToCursor: boolean;
}

export type NearbySeriesArray = NearbySeriesInfo[];

/**
 * Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function checkforNearbySeries(
  data: EChartsDataFormat,
  pointInGrid: number[],
  yBuffer: number,
  chart?: EChartsInstance,
  unit?: UnitOptions
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
      if (currentNearbySeriesData.length >= OPTIMIZED_MODE_SERIES_LIMIT) break;
      if (currentSeries !== undefined) {
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
                const formattedY = formatValue(yValue, unit);
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
        notBlur: false,
      });
    } else {
      // When no emphasized series with bold text, notBlur allows opacity fadeout to not trigger.
      chart.dispatchAction({
        type: 'highlight',
        seriesIndex: nearbySeriesIndexes,
        notBlur: true,
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
  chartData,
  chart,
  unit,
  showAllSeries = false,
}: {
  mousePos: CursorData['coords'];
  pinnedPos: CursorData['coords'];
  chartData: EChartsDataFormat;
  chart?: EChartsInstance;
  unit?: UnitOptions;
  showAllSeries?: boolean;
}) {
  if (chart === undefined || mousePos === null) return [];

  // prevents multiple tooltips showing from adjacent charts
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

  // allows moving cursor inside tooltip
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
      return checkforNearbySeries(chartData, pointInGrid, yBuffer, chart, unit);
    }
  }

  // clear all highlighted series when cursor exits canvas
  // https://echarts.apache.org/en/api.html#action.downplay
  for (let i = 0; i < totalSeries; i++) {
    if (chart?.dispatchAction !== undefined) {
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: i,
      });
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
}: {
  valueToCheck: number;
  baseValue: number;
  percentage: number;
}): boolean {
  const range = (percentage / 100) * baseValue;
  const lowerBound = baseValue - range;
  const upperBound = baseValue + range;
  return valueToCheck >= lowerBound && valueToCheck <= upperBound;
}

/*
 * Get range to check within for nearby series to show in tooltip.
 */
export function getYBuffer({
  yInterval,
  totalSeries,
  showAllSeries = false,
}: {
  yInterval: number;
  totalSeries: number;
  showAllSeries?: boolean;
}) {
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
