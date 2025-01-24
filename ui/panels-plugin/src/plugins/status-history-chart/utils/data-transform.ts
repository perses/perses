// Copyright 2024 The Perses Authors
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

import { getColorForValue, LegendItem } from '@perses-dev/components';
import { TimeScale, TimeSeriesData } from '@perses-dev/core';
import { QueryData } from '@perses-dev/plugin-system';
import { useMemo } from 'react';
import { getCommonTimeScaleForQueries } from './get-timescale';

interface StatusHistoryDataModel {
  legendItems: LegendItem[];
  statusHistoryData: Array<[number, number, number | undefined]>;
  xAxisCategories: number[];
  yAxisCategories: string[];
  timeScale?: TimeScale;
}

function generateCompleteTimestamps(timescale?: TimeScale): number[] {
  if (!timescale) {
    return [];
  }
  const { startMs, endMs, stepMs } = timescale;
  const timestamps: number[] = [];
  for (let time = startMs; time <= endMs; time += stepMs) {
    timestamps.push(time);
  }
  return timestamps;
}

export function useStatusHistoryDataModel(
  queryResults: Array<QueryData<TimeSeriesData>>,
  colors: string[]
): StatusHistoryDataModel {
  return useMemo(() => {
    if (!queryResults || queryResults.length === 0) {
      return {
        legendItems: [],
        statusHistoryData: [],
        xAxisCategories: [],
        yAxisCategories: [],
      };
    }

    const timeScale = getCommonTimeScaleForQueries(queryResults);
    const statusHistoryData: Array<[number, number, number]> = [];
    const yAxisCategories: string[] = [];
    const legendSet = new Set<number>();

    const xAxisCategories = generateCompleteTimestamps(timeScale);

    queryResults.forEach(({ data }) => {
      if (!data) {
        return;
      }

      data.series.forEach((item) => {
        const instance = item.formattedName || '';

        yAxisCategories.push(instance);

        const yIndex = yAxisCategories.length - 1;

        item.values.forEach(([time, value]) => {
          const itemIndexOnXaxis = xAxisCategories.findIndex((v) => v === time);

          if (value !== null && itemIndexOnXaxis !== -1) {
            legendSet.add(value);
            statusHistoryData.push([itemIndexOnXaxis, yIndex, value]);
          }
        });
      });
    });

    const legendItems: LegendItem[] = Array.from(legendSet).map((value, idx) => {
      const color = colors[idx] || getColorForValue(value, colors[0] || '#1f77b4');
      return {
        id: `${idx}-${value}`,
        label: String(value),
        color,
      };
    });

    return {
      xAxisCategories,
      yAxisCategories,
      legendItems,
      statusHistoryData,
      timeScale,
    };
  }, [queryResults, colors]);
}
