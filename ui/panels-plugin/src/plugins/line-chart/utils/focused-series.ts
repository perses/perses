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

import type { EChartsOption } from 'echarts';
import { GraphSeriesValueTuple } from '@perses-dev/core';
import { TOOLTIP_DATE_FORMAT, TOOLTIP_MAX_ITEMS } from '../tooltip/tooltip-model';

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
 * Increase xBuffer (ms) to show multiple x axis dates for a given series in the tooltip
 * Adjust yBuffer (defaults to half of y axis interval) to increase or decrease number of series shown
 */
export function getNearbySeries(
  series: EChartsOption['series'],
  pointInGrid: number[],
  xBuffer: number,
  yBuffer: number
): FocusedSeriesArray {
  const currentFocusedData: FocusedSeriesArray = [];
  const focusedX: number | null = pointInGrid[0] ?? null;
  const focusedY: number | null = pointInGrid[1] ?? null;
  if (focusedX === null || focusedY === null) {
    return currentFocusedData;
  }

  if (Array.isArray(series)) {
    for (let seriesIdx = 0; seriesIdx < series.length; seriesIdx++) {
      const currentSeries = series[seriesIdx];
      if (currentFocusedData.length > TOOLTIP_MAX_ITEMS) break;
      if (currentSeries !== undefined) {
        const currentSeriesName = currentSeries.name ? currentSeries.name.toString() : '';
        const markerColor = currentSeries.color ?? '#000';
        if (Array.isArray(currentSeries.data)) {
          for (let datumIdx = 0; datumIdx < currentSeries.data.length; datumIdx++) {
            const datum: GraphSeriesValueTuple = currentSeries.data[datumIdx];
            const xValue = datum[0];
            const yValue = datum[1];
            if (focusedX <= xValue + xBuffer && focusedX >= xValue - xBuffer) {
              if (focusedY <= yValue + yBuffer && focusedY >= yValue - yBuffer) {
                const formattedDate = TOOLTIP_DATE_FORMAT.format(xValue);
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
