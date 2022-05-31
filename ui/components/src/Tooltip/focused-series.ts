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

import { ECharts as EChartsInstance } from 'echarts/core';
import { EChartsDataFormat } from '../model/graph';
import { CursorData, TOOLTIP_DATE_FORMAT, TOOLTIP_MAX_ITEMS } from './tooltip-model';

export interface FocusedSeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: string;
  markerColor: string;
  x: number;
  y: number;
}

export type FocusedSeriesArray = FocusedSeriesInfo[];

/**
 * Returns formatted series data for the points that are close to the user's cursor
 * Adjust yBuffer to increase or decrease number of series shown
 */
export function getNearbySeries(data: EChartsDataFormat, pointInGrid: number[], yBuffer: number): FocusedSeriesArray {
  const currentFocusedData: FocusedSeriesArray = [];
  const focusedX: number | null = pointInGrid[0] ?? null;
  const focusedY: number | null = pointInGrid[1] ?? null;

  if (focusedX === null || focusedY === null) {
    return currentFocusedData;
  }

  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < data.timeSeries.length; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentFocusedData.length > TOOLTIP_MAX_ITEMS) break;
      if (currentSeries !== undefined) {
        const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
        const markerColor = currentSeries.color ?? '#000';
        if (Array.isArray(currentSeries.data)) {
          for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
            const xValue = data.xAxis[datumIdx] ?? 0;
            const yValue = currentSeries.data[datumIdx] ?? 0;
            if (focusedX === datumIdx) {
              if (yValue !== '-' && focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
                const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
                const formattedDate = TOOLTIP_DATE_FORMAT.format(xValueMilliSeconds);
                currentFocusedData.push({
                  seriesIdx: seriesIdx,
                  datumIdx: datumIdx,
                  seriesName: currentSeriesName,
                  date: formattedDate,
                  x: xValue,
                  y: yValue,
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
  chart?: EChartsInstance
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
  // tooltip trigger area gets smaller with more series
  const yBuffer = seriesNum > TOOLTIP_MAX_ITEMS ? yAxisInterval * 0.5 : yAxisInterval * 2;

  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return getNearbySeries(chartData, pointInGrid, yBuffer);
    }
  }
  return [];
}
