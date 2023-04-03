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

import { StepOptions, TimeScale, getCommonTimeScale } from '@perses-dev/core';
import { OPTIMIZED_MODE_SERIES_LIMIT, EChartsTimeSeries, EChartsValues } from '@perses-dev/components';
import { useTimeSeriesQueries } from '@perses-dev/plugin-system';
import {
  DEFAULT_AREA_OPACITY,
  DEFAULT_CONNECT_NULLS,
  DEFAULT_LINE_WIDTH,
  DEFAULT_POINT_RADIUS,
  VisualOptions,
} from '../time-series-chart-model';

export type RunningQueriesState = ReturnType<typeof useTimeSeriesQueries>;

export const EMPTY_GRAPH_DATA = {
  timeSeries: [],
  xAxis: [],
  legendItems: [],
};

/**
 * Given a list of running queries, calculates a common time scale for use on
 * the x axis (i.e. start/end dates and a step that is divisible into all of
 * the queries' steps).
 */
export function getCommonTimeScaleForQueries(queries: RunningQueriesState): TimeScale | undefined {
  const seriesData = queries.map((query) => (query.isLoading ? undefined : query.data));
  return getCommonTimeScale(seriesData);
}

/**
 * Gets default ECharts line series option properties
 */
export function getLineSeries(
  formattedName: string,
  data: EChartsTimeSeries['data'],
  visual: VisualOptions,
  paletteColor?: string
): EChartsTimeSeries {
  const lineWidth = visual.line_width ?? DEFAULT_LINE_WIDTH;
  const pointRadius = visual.point_radius ?? DEFAULT_POINT_RADIUS;
  return {
    type: 'line',
    name: formattedName,
    data: data,
    connectNulls: visual.connect_nulls ?? DEFAULT_CONNECT_NULLS,
    color: paletteColor,
    stack: visual.stack === 'All' ? visual.stack : undefined,
    sampling: 'lttb',
    progressiveThreshold: OPTIMIZED_MODE_SERIES_LIMIT, // https://echarts.apache.org/en/option.html#series-lines.progressiveThreshold
    showSymbol: visual.show_points === 'Always' ? true : false,
    symbolSize: pointRadius,
    lineStyle: {
      width: lineWidth,
    },
    areaStyle: {
      opacity: visual.area_opacity ?? DEFAULT_AREA_OPACITY,
    },
    emphasis: {
      disabled: visual.area_opacity !== undefined && visual.area_opacity > 0, // prevents flicker when moving cursor between shaded regions
      lineStyle: {
        width: lineWidth + 1,
      },
    },
  };
}

/**
 * Gets threshold-specific line series styles
 * markLine cannot be used since it does not update yAxis max / min
 * and threshold data needs to show in the tooltip
 */
export function getThresholdSeries(
  name: string,
  data: EChartsTimeSeries['data'],
  threshold: StepOptions
): EChartsTimeSeries {
  return {
    type: 'line',
    name: name,
    data: data,
    color: threshold.color,
    label: {
      show: false,
    },
    lineStyle: {
      type: 'dashed',
      width: 2,
    },
    emphasis: {
      lineStyle: {
        width: 2.5,
      },
    },
  };
}

/**
 * Converts percent threshold into absolute step value
 * If max is undefined, use the max value from time series data as default
 */
export function convertPercentThreshold(percent: number, data: EChartsTimeSeries[], max?: number, min?: number) {
  const percentDecimal = percent / 100;
  const adjustedMax = max ?? findMax(data);
  const adjustedMin = min ?? 0;
  const total = adjustedMax - adjustedMin;
  return percentDecimal * total + adjustedMin;
}

function findMax(timeSeries: EChartsTimeSeries[]) {
  let max = 0;
  timeSeries.forEach((series) => {
    series.data.forEach((value: EChartsValues) => {
      if (typeof value === 'number' && value > max) {
        max = value;
      }
    });
  });
  return max;
}
