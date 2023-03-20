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

import { AbsoluteTimeRange, StepOptions } from '@perses-dev/core';
import { OPTIMIZED_MODE_SERIES_LIMIT } from '@perses-dev/components';
import { EChartsTimeSeries, EChartsValues } from '@perses-dev/components';
import { TimeSeries, useTimeSeriesQueries } from '@perses-dev/plugin-system';
import { gcd } from '../../../utils/mathjs';
import {
  DEFAULT_AREA_OPACITY,
  DEFAULT_CONNECT_NULLS,
  DEFAULT_LINE_WIDTH,
  DEFAULT_POINT_RADIUS,
  VisualOptions,
} from '../time-series-chart-model';

export interface TimeScale {
  startMs: number;
  endMs: number;
  stepMs: number;
}

export type RunningQueriesState = ReturnType<typeof useTimeSeriesQueries>;

export const EMPTY_GRAPH_DATA = {
  timeSeries: [],
  xAxis: [],
  legendItems: [],
};

export const MIN_STEP_INTERVAL_MS = 10;

/**
 * Given a list of running queries, calculates a common time scale for use on
 * the x axis (i.e. start/end dates and a step that is divisible into all of
 * the queries' steps).
 */
export function getCommonTimeScale(queryResults: RunningQueriesState): TimeScale | undefined {
  let timeRange: AbsoluteTimeRange | undefined = undefined;
  const steps: number[] = [];
  for (const { isLoading, data } of queryResults) {
    if (isLoading || data === undefined || data.timeRange === undefined || data.stepMs === undefined) continue;

    // Keep track of query steps so we can calculate a common one for the graph
    steps.push(data.stepMs);

    // If we don't have an overall time range yet, just start with this one
    if (timeRange === undefined) {
      timeRange = data.timeRange;
      continue;
    }

    // Otherwise, see if this query has a start or end outside of the current
    // time range
    if (data.timeRange.start < timeRange.start) {
      timeRange.start = data.timeRange.start;
    }
    if (data.timeRange.end > timeRange.end) {
      timeRange.end = data.timeRange.end;
    }
  }

  if (timeRange === undefined) return undefined;

  // Use the greatest common divisor of all step values as the overall step
  // for the x axis (or if only one query, just use that query's step value)
  let stepMs: number;
  if (steps.length === 1) {
    stepMs = steps[0] as number;
  } else {
    const calculatedStepMs = gcd(...steps);
    stepMs = calculatedStepMs < MIN_STEP_INTERVAL_MS ? MIN_STEP_INTERVAL_MS : calculatedStepMs;
  }

  const startMs = timeRange.start.valueOf();
  const endMs = timeRange.end.valueOf();

  return { startMs, endMs, stepMs };
}

/**
 * Given a common time scale, generates an array of timestamp (in ms) values
 * for the x axis of a graph.
 */
export function getXValues(timeScale: TimeScale): number[] {
  const xValues: number[] = [];
  let timestamp = timeScale.startMs;
  while (timestamp <= timeScale.endMs) {
    xValues.push(timestamp);
    timestamp += timeScale.stepMs;
  }
  return xValues;
}

/**
 * Given a TimeSeries from a query and the time scale, gets the values for the
 * y axis of a graph, filling in any timestamps that are missing from the time
 * series data with `null` values.
 */
export function getYValues(series: TimeSeries, timeScale: TimeScale): Array<number | null> {
  let timestamp = timeScale.startMs;

  const yValues: Array<number | null> = [];
  for (const valueTuple of series.values) {
    // Fill in values up to the current series value timestamp with nulls
    while (timestamp < valueTuple[0]) {
      yValues.push(null);
      timestamp += timeScale.stepMs;
    }

    // Now add the current value since timestamp should match
    yValues.push(valueTuple[1]);
    timestamp += timeScale.stepMs;
  }

  // Add null values at the end of the series if necessary
  while (timestamp <= timeScale.endMs) {
    yValues.push(null);
    timestamp += timeScale.stepMs;
  }

  return yValues;
}

/**
 * Gets default ECharts line series option properties
 */
export function getLineSeries(
  formattedName: string,
  data: EChartsTimeSeries['data'],
  visual: VisualOptions,
  color?: string
): EChartsTimeSeries {
  const lineWidth = visual.line_width ?? DEFAULT_LINE_WIDTH;
  const pointRadius = visual.point_radius ?? DEFAULT_POINT_RADIUS;
  return {
    type: 'line',
    name: formattedName,
    data: data,
    connectNulls: visual.connect_nulls ?? DEFAULT_CONNECT_NULLS,
    color: color,
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
