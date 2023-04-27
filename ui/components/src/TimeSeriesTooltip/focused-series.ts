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

  if (focusedX === null || focusedY === null) {
    return currentFocusedData;
  }

  if (Array.isArray(data.xAxis) && Array.isArray(data.timeSeries)) {
    // TODO: better way to calc xBuffer for longer time ranges
    const xBuffer = focusedX * 0.0005;
    for (let seriesIdx = 0; seriesIdx < data.timeSeries.length; seriesIdx++) {
      const currentSeries = data.timeSeries[seriesIdx];
      if (currentFocusedData.length >= TOOLTIP_MAX_ITEMS) break;
      if (currentSeries !== undefined) {
        const lineSeries = currentSeries as LineSeriesOption;
        const currentSeriesName = lineSeries.name ? lineSeries.name.toString() : '';
        const markerColor = lineSeries.color ?? '#000';
        if (Array.isArray(data.dataset)) {
          for (let datumIdx = 0; datumIdx < data.dataset.length; datumIdx++) {
            const currentDataset = data.dataset.length > 0 ? data.dataset[seriesIdx] : undefined;
            if (currentDataset !== undefined) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const currentDatasetSource: any = currentDataset.source ?? undefined;
              // skip first row in dataset source since it is for column names, ex: ['timestamp', 'value']
              if (currentDatasetSource !== undefined && datumIdx > 0) {
                // TODO: fix types
                const focusedTimeSeries = currentDatasetSource[datumIdx] as unknown as TimeSeriesValueTuple;
                if (focusedTimeSeries !== undefined) {
                  const xValueCurrent = focusedTimeSeries[0];
                  const yValue = focusedTimeSeries[1];
                  // TODO: ensure null values not displayed in tooltip
                  if (yValue !== undefined && yValue !== null) {
                    if (focusedX < xValueCurrent + xBuffer && focusedX > xValueCurrent - xBuffer) {
                      if (focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                        // determine whether to convert timestamp to ms, see: https://stackoverflow.com/a/23982005/17575201
                        // const xValueMilliSeconds = xValue > 99999999999 ? xValue : xValue * 1000; // TODO: is this needed? will it always be ms?
                        // const formattedDate = TOOLTIP_DATE_FORMAT.format(xValueMilliSeconds);
                        const formattedDate = TOOLTIP_DATE_FORMAT.format(focusedX);
                        const formattedY = formatValue(yValue, unit);
                        currentFocusedData.push({
                          seriesIdx: seriesIdx,
                          datumIdx: datumIdx,
                          seriesName: currentSeriesName,
                          date: formattedDate,
                          x: xValueCurrent,
                          y: yValue,
                          formattedY: formattedY,
                          markerColor: markerColor.toString(),
                        });
                        break;
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
  const yBuffer = yAxisInterval * 2; // TODO: add back dynamic nearby range

  const pointInPixel = [mousePos.plotCanvas.x ?? 0, mousePos.plotCanvas.y ?? 0];
  if (chart.containPixel('grid', pointInPixel)) {
    const pointInGrid = chart.convertFromPixel('grid', pointInPixel);
    if (pointInGrid[0] !== undefined && pointInGrid[1] !== undefined) {
      return getNearbySeries(chartData, pointInGrid, yBuffer, unit);
    }
  }
  return [];
}
