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

import { AbsoluteTimeRange, TimeScale, TimeSeries, TimeSeriesAggregationValue, TimeSeriesData } from '../model';
import { gcd } from './mathjs';

export const MIN_STEP_INTERVAL_MS = 10;

/**
 * Given a common time scale (see `getCommonTimeScale`), generates an array of
 * timestamp values in ms for the x axis of a graph.
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
 * Given a TimeSeries from a query and a common time scale (see `getCommonTimeScale`),
 * gets the values for the y axis of a graph, filling in any timestamps that are
 * missing from the time series data with `null` values.
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
 * Given a list of running queries, calculates a common time scale for use on
 * the x axis (i.e. start/end dates and a step that is divisible into all of
 * the queries' steps).
 */
export function getCommonTimeScale(seriesData: Array<TimeSeriesData | undefined>): TimeScale | undefined {
  let timeRange: AbsoluteTimeRange | undefined = undefined;
  const steps: number[] = [];
  for (const data of seriesData) {
    if (data === undefined || data.timeRange === undefined || data.stepMs === undefined) continue;

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
 * Given a list of values for time series data, it will return an object containing
 * the following aggregate calculations:
 * - AverageNonNull: average across non-null values
 * - Total: sum of values
 * - Min: minimum value
 * - Max: maximum value
 * - FirstNonNull: first non-null value
 * - LastNonNull: last non-null value
 */
export function getAggregationValues(
  values: Array<number | null>
): Record<TimeSeriesAggregationValue, number | undefined> {
  let total: undefined | number = undefined;
  let min: undefined | number = undefined;
  let max: undefined | number = undefined;
  let firstNonNull: undefined | number = undefined;
  let lastNonNull: undefined | number = undefined;
  let nonNullCount = 0;

  // Calculating all values in a single loop because we can be working with
  // large quantities of data and looping repeatedly would have performance
  // issues. For now, calculating all the values we need because the actual math
  // is pretty cheap. If that changes, we may want to add a configuration option
  // that specifies the values to calculate.
  values.forEach((value) => {
    if (typeof value === 'number') {
      if (typeof total === 'undefined') {
        // Init total the first time we see a non-null value.
        total = 0;
      }
      total += value;

      nonNullCount += 1;

      if (typeof firstNonNull === 'undefined') {
        // Set first value at the first non-null value we see.
        firstNonNull = value;
      }

      // Set last non-null every time we see a non-null value to ensure it's
      // eventually set the last value.
      lastNonNull = value;

      // Init at the first non-null value we see and then adjust based on the
      // larger value.
      if (typeof min === 'undefined') {
        min = value;
      } else {
        min = Math.min(min, value);
      }

      // Init at the first non-null value we see and then adjust based on the
      // larger value.
      if (typeof max === 'undefined') {
        max = value;
      } else {
        max = Math.max(max, value);
      }
    }
  });

  let averageNonNull: undefined | number = undefined;
  if (typeof total !== 'undefined' && typeof nonNullCount !== 'undefined') {
    averageNonNull = total > 0 && nonNullCount > 0 ? total / nonNullCount : 0;
  }

  return {
    AverageNonNull: averageNonNull,
    Total: total,
    Min: min,
    Max: max,
    FirstNonNull: firstNonNull,
    LastNonNull: lastNonNull,
  };
}
