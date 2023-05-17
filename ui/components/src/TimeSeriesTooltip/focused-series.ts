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
export const DEFAULT_NEARBY_SERIES_RANGE_MULTIPLIER = 5.5; // adjusts how many focused series show in tooltip
export const NARROW_NEARBY_SERIES_RANGE_MULTIPLIER = 2; // used to reduce number of focused series for heavy queries
export const SHOW_MORE_NEARBY_SERIES_LIMIT = 5;

export interface FocusedSeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: number;
  markerColor: string;
  x: number;
  y: number;
  formattedY: string;
}

export type FocusedSeriesArray = FocusedSeriesInfo[];

/**
 * Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function getNearbySeries(
  data: EChartsDataFormat,
  pointInGrid: number[],
  yBuffer: number,
  chart?: EChartsInstance,
  unit?: UnitOptions
): FocusedSeriesArray {
  const currentFocusedData: FocusedSeriesArray = [];
  const focusedX: number | null = pointInGrid[0] ?? null;
  const focusedY: number | null = pointInGrid[1] ?? null;

  if (focusedX === null || focusedY === null) {
    return currentFocusedData;
  }

  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < data.timeSeries.length; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      // TODO: look into using batch or excludeSeriesId within downplay action to fix flicker
      if (chart?.dispatchAction !== undefined) {
        // clears emphasis state of lines that are not focused
        chart.dispatchAction({
          type: 'downplay',
          seriesIndex: seriesIdx,
        });
      }
      if (currentFocusedData.length >= OPTIMIZED_MODE_SERIES_LIMIT) break;
      if (currentSeries !== undefined) {
        const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
        const markerColor = currentSeries.color ?? '#000';
        if (Array.isArray(currentSeries.data)) {
          for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
            const xValue = data.xAxis[datumIdx] ?? 0;
            const yValue = currentSeries.data[datumIdx];
            // ensure null values not displayed in tooltip
            if (yValue !== undefined && yValue !== null && focusedX === datumIdx) {
              if (yValue !== '-' && focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
                const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
                const formattedY = formatValue(yValue, unit);
                // trigger emphasis state of nearby series so tooltip matches highlighted lines
                // https://echarts.apache.org/en/api.html#action.highlight
                if (chart?.dispatchAction !== undefined) {
                  chart.dispatchAction({
                    type: 'highlight',
                    seriesIndex: seriesIdx,
                  });
                }
                currentFocusedData.push({
                  seriesIdx: seriesIdx,
                  datumIdx: datumIdx,
                  seriesName: currentSeriesName,
                  date: xValueMilliSeconds,
                  x: xValue,
                  y: yValue,
                  formattedY: formattedY,
                  markerColor: markerColor.toString(),
                });
              }
            }
          }
        }
      }
    }
  }
  return currentFocusedData;
}

/**
 * Uses mouse position to determine whether user is hovering over a chart canvas
 * If yes, convert from pixel values to logical cartesian coordinates and return all focused series
 */
export function getFocusedSeriesData(
  mousePos: CursorData['coords'],
  chartData: EChartsDataFormat,
  pinnedPos: CursorData['coords'],
  chart?: EChartsInstance,
  unit?: UnitOptions
) {
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
  const yAxisInterval = chartModel.getComponent('yAxis').axis.scale._interval;

  const seriesNum = chartData.timeSeries.length;

  // tooltip trigger area gets smaller with more series, increase yAxisInterval multiplier to expand nearby series range
  const yBuffer =
    seriesNum > SHOW_MORE_NEARBY_SERIES_LIMIT
      ? yAxisInterval * NARROW_NEARBY_SERIES_RANGE_MULTIPLIER
      : yAxisInterval * DEFAULT_NEARBY_SERIES_RANGE_MULTIPLIER;

  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return getNearbySeries(chartData, pointInGrid, yBuffer, chart, unit);
    }
  }

  // clear all highlighted series when cursor exits canvas
  // https://echarts.apache.org/en/api.html#action.downplay
  for (let i = 0; i < seriesNum; i++) {
    if (chart?.dispatchAction !== undefined) {
      chart.dispatchAction({
        type: 'downplay',
        seriesIndex: i,
      });
    }
  }
  return [];
}
