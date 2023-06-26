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

import { LineSeriesOption } from 'echarts';
import { TimeSeriesValueTuple } from '@perses-dev/core';
import { formatValue, UnitOptions, EChartsDatasetFormat } from '../../model';
import { NearbySeriesArray, TOOLTIP_DATE_FORMAT } from '../../TimeSeriesTooltip';

/**
 * Returns formatted series data for the points that are close to the user's cursor.
 * Adjust xBuffer and yBuffer to increase or decrease number of series shown.
 */
export function checkforNearbyTimeSeries(
  data: EChartsDatasetFormat,
  pointInGrid: number[],
  yBuffer: number,
  unit?: UnitOptions
): NearbySeriesArray {
  const currentFocusedData: NearbySeriesArray = [];
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
      // if (currentFocusedData.length >= TOOLTIP_MAX_ITEMS) break;
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
