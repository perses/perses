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
import { LineSeriesOption } from 'echarts';
import { TimeSeriesValueTuple } from '@perses-dev/core';
import { formatValue, UnitOptions, EChartsDataFormat, EChartsValues } from '../model';
import { CursorData, TOOLTIP_DATE_FORMAT, TOOLTIP_MAX_ITEMS } from './tooltip-model';

export interface FocusedSeriesInfo {
  seriesIdx: number | null;
  datumIdx: number | null;
  seriesName: string;
  date: string;
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
  unit?: UnitOptions
): FocusedSeriesArray {
  const currentFocusedData: FocusedSeriesArray = [];
  const focusedX: number | null = pointInGrid[0] ?? null;
  const focusedY: number | null = pointInGrid[1] ?? null;
  // console.log('focusedX: ', focusedX);
  // console.log('focusedY: ', focusedY);

  if (focusedX === null || focusedY === null) {
    return currentFocusedData;
  }

  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    for (let seriesIdx = 0; seriesIdx < data.timeSeries.length; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentFocusedData.length >= TOOLTIP_MAX_ITEMS) break;
      if (currentSeries !== undefined) {
        const lineSeries = currentSeries as LineSeriesOption;
        // console.log('lineSeries -> ', lineSeries);
        // TODO: pass dataset into tooltip
        const currentSeriesName = lineSeries.name ? lineSeries.name.toString() : '';
        const markerColor = lineSeries.color ?? '#000';
        // if (Array.isArray(lineSeries.data)) {
        if (Array.isArray(data.dataset)) {
          // for (let datumIdx = 0; datumIdx < lineSeries.data.length; datumIdx++) {
          for (let datumIdx = 0; datumIdx < data.dataset.length; datumIdx++) {
            const xValue = data.xAxis[datumIdx] ?? 0;
            // const currentDatasetSource =
            //   Array.isArray(data.dataset) && data.dataset.length > 0 ? data.dataset[0] : undefined;
            const currentDataset = data.dataset.length > 0 ? data.dataset[seriesIdx] : undefined;
            // console.log('data.dataset: ', data.dataset);
            if (currentDataset !== undefined) {
              // console.log('currentDatasetSource -> ', currentDatasetSource);
              // let yValue: EChartsValues = '-';
              // yValue = 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentDatasetSource: any = currentDataset.source ?? undefined;
              if (currentDatasetSource !== undefined) {
                const focusedTimeSeries = currentDatasetSource[datumIdx] as unknown as TimeSeriesValueTuple;
                const yValue = focusedTimeSeries[1];
                // console.log('focusedY: ', focusedY);
                // console.log('yValue: ', yValue);
                // const yValue = currentDatasetSource.source !== undefined && Array.isArray(currentDatasetSource.source) ? currentDatasetSource.source[datumIdx][1] as EChartsValues;
                // console.log('yValue: ', yValue);
                // const yValue = data.dataset?[seriesIdx].source[datumIdx];
                // const yValue = currentSeries.data[datumIdx];
                // ensure null values not displayed in tooltip
                // if (yValue !== undefined && yValue !== null && focusedX === datumIdx) { // TODO: add back! focusedX is now a timestamp!
                if (yValue !== undefined && yValue !== null) {
                  // if (yValue !== '-' && focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                  // if (focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                  if (focusedY <= yValue + 2 && focusedY >= yValue - 2) {
                    // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
                    const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000;
                    const formattedDate = TOOLTIP_DATE_FORMAT.format(xValueMilliSeconds);
                    const formattedY = formatValue(yValue, unit);
                    currentFocusedData.push({
                      seriesIdx: seriesIdx,
                      datumIdx: datumIdx,
                      seriesName: currentSeriesName,
                      date: formattedDate,
                      x: xValue,
                      y: yValue,
                      formattedY: formattedY,
                      markerColor: markerColor.toString(),
                    });
                    console.log('currentFocusedData: ', currentFocusedData);
                  }
                }
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

  if (chartData.timeSeries === undefined) return [];

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

  // tooltip trigger area gets smaller with more series, increase yAxisInterval multiplier to expand nearby series range
  // const seriesNum = chartData.timeSeries.length;
  // const yBuffer = seriesNum > TOOLTIP_MAX_ITEMS ? yAxisInterval * 0.5 : yAxisInterval * 5;
  const yBuffer = yAxisInterval * 9;

  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return getNearbySeries(chartData, pointInGrid, yBuffer, unit);
    }
  }
  return [];
}
